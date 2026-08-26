<?php

declare(strict_types=1);

namespace App\Core;

use BadMethodCallException;
use InvalidArgumentException;
use PDO;
use ReflectionClass;
use ReflectionException;
use ReflectionNamedType;
use RuntimeException;
use Throwable;

/**
 * Maps HTTP methods and URL paths to controller actions.
 */
final class Router
{
    /**
     * @var array<string, array<int, array{path: string, pattern: string, parameters: array<int, string>, handler: array{0: class-string, 1: string}}>>
     */
    private array $routes = [];

    /**
     * Registers a GET route.
     *
     * @param array{0: class-string, 1: string} $handler Controller class and method.
     */
    public function get(string $path, array $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    /**
     * Registers a POST route.
     *
     * @param array{0: class-string, 1: string} $handler Controller class and method.
     */
    public function post(string $path, array $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    /**
     * Registers a PUT route.
     *
     * @param array{0: class-string, 1: string} $handler Controller class and method.
     */
    public function put(string $path, array $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    /**
     * Registers a DELETE route.
     *
     * @param array{0: class-string, 1: string} $handler Controller class and method.
     */
    public function delete(string $path, array $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    /**
     * Dispatches an HTTP request to the matching controller action.
     */
    public function dispatch(string $method, string $uri): mixed
    {
        $requestMethod = strtoupper($method);
        $requestPath = $this->normalizePath((string) (parse_url($uri, PHP_URL_PATH) ?: '/'));

        foreach ($this->routes[$requestMethod] ?? [] as $route) {
            if (preg_match($route['pattern'], $requestPath, $matches) !== 1) {
                continue;
            }

            array_shift($matches);
            $parameters = array_map('rawurldecode', $matches);

            try {
                [$controllerClass, $methodName] = $route['handler'];
                $controller = $this->makeController($controllerClass);

                if (!method_exists($controller, $methodName)) {
                    throw new BadMethodCallException(sprintf(
                        'Controller method %s::%s() does not exist.',
                        $controllerClass,
                        $methodName
                    ));
                }

                return $controller->{$methodName}(...$parameters);
            } catch (Throwable $exception) {
                error_log($exception->getMessage());
                error_log($exception->getTraceAsString());

                Response::error('Internal Server Error', 500);
            }
        }

        Response::error('Not Found', 404);
    }

    /**
     * Registers a route for the provided HTTP method.
     *
     * @param array{0: class-string, 1: string} $handler Controller class and method.
     */
    private function addRoute(string $method, string $path, array $handler): void
    {
        $this->assertValidHandler($handler);

        [$pattern, $parameters] = $this->compilePath($path);
        $this->routes[strtoupper($method)][] = [
            'path' => $this->normalizePath($path),
            'pattern' => $pattern,
            'parameters' => $parameters,
            'handler' => $handler,
        ];
    }

    /**
     * Converts a route path into a regular expression and ordered parameter list.
     *
     * @return array{0: string, 1: array<int, string>}
     */
    private function compilePath(string $path): array
    {
        $normalizedPath = $this->normalizePath($path);

        if ($normalizedPath === '/') {
            return ['#^/$#', []];
        }

        $parameters = [];
        $segments = explode('/', trim($normalizedPath, '/'));
        $patternSegments = array_map(
            static function (string $segment) use (&$parameters): string {
                if (preg_match('/^\{([A-Za-z_][A-Za-z0-9_]*)\}$/', $segment, $matches) === 1) {
                    $parameters[] = $matches[1];

                    return '([^/]+)';
                }

                return preg_quote($segment, '#');
            },
            $segments
        );

        return ['#^/' . implode('/', $patternSegments) . '$#', $parameters];
    }

    /**
     * Creates a controller instance and resolves supported constructor dependencies.
     *
     * @param class-string $controllerClass
     *
     * @throws ReflectionException
     * @throws RuntimeException
     */
    private function makeController(string $controllerClass): object
    {
        if (!class_exists($controllerClass)) {
            throw new RuntimeException(sprintf('Controller class %s does not exist.', $controllerClass));
        }

        $reflection = new ReflectionClass($controllerClass);
        $constructor = $reflection->getConstructor();

        if ($constructor === null || $constructor->getNumberOfParameters() === 0) {
            return $reflection->newInstance();
        }

        $dependencies = [];

        foreach ($constructor->getParameters() as $parameter) {
            $type = $parameter->getType();

            if ($type instanceof ReflectionNamedType && $type->getName() === PDO::class) {
                $dependencies[] = Database::getInstance();
                continue;
            }

            if ($parameter->isDefaultValueAvailable()) {
                $dependencies[] = $parameter->getDefaultValue();
                continue;
            }

            throw new RuntimeException(sprintf(
                'Cannot resolve constructor dependency "$%s" for %s.',
                $parameter->getName(),
                $controllerClass
            ));
        }

        return $reflection->newInstanceArgs($dependencies);
    }

    /**
     * Normalizes a URL path for route registration and matching.
     */
    private function normalizePath(string $path): string
    {
        $path = '/' . ltrim($path, '/');
        $path = rtrim($path, '/');

        return $path === '' ? '/' : $path;
    }

    /**
     * Validates a controller handler definition.
     *
     * @param array<mixed> $handler
     */
    private function assertValidHandler(array $handler): void
    {
        if (
            count($handler) !== 2
            || !isset($handler[0], $handler[1])
            || !is_string($handler[0])
            || !is_string($handler[1])
            || $handler[0] === ''
            || $handler[1] === ''
        ) {
            throw new InvalidArgumentException(
                'Route handler must be an array in the form [ControllerClassName::class, "methodName"].'
            );
        }
    }
}
