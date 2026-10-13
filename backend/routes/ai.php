<?php

declare(strict_types=1);
use App\Mcp\Servers\VaultServer;
use Laravel\Mcp\Facades\Mcp;
Mcp::web('/mcp/vault',VaultServer::class)->middleware(['auth:sanctum','throttle:60,1']);