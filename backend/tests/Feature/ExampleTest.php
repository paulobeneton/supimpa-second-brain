<?php

declare(strict_types=1);
namespace Tests\Feature;
use Tests\TestCase;
final class ExampleTest extends TestCase {
    public function test_health_endpoint(): void { $this->get('/up')->assertOk(); }
}