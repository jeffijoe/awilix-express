// Type definitions for awilix-express
// Project: https://github.com/talyssonoc/awilix-express
// Definitions by: Brian Love <https://github.com/blove/>

/// <reference types="awilix" />
/// <reference types="express" />

import awilix = require('awilix');
import express = require('express');

/**
 * The core.Request interface.
 * @interface Request
 */
export interface Request extends express.Request {
  container: awilix.AwilixContainer;
}

/**
 * Bind awilix scope for each request.
 * @param {AwilixContainer} container
 */
export declare function scopePerRequest(container: awilix.AwilixContainer): express.RequestHandler;
