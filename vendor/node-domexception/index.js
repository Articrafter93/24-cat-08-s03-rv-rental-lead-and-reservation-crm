'use strict';

// Local stand-in for the deprecated npm package node-domexception@1.0.0.
// Two dependencies pull it in: @anthropic-ai/sdk 0.x (through formdata-node) and
// @google/genai (through google-auth-library -> gaxios -> node-fetch -> fetch-blob).
// Checked against the npm registry on 2026-11-10: @anthropic-ai/sdk 1.x no longer needs it,
// but the newest versions of the @google/genai chain still do (fetch-blob 4.0.0 included),
// so upgrading alone cannot remove it.
// The original package only exported globalThis.DOMException, plus a polyfill for Node < 17.
// Node 17+ has DOMException built in, so this keeps the same export without the deprecated
// package or its install-time deprecation warning.
// package.json lists it as a root dependency and "overrides" points every dependent at that
// copy ("$node-domexception"). A bare "file:" path inside "overrides" is resolved relative to
// each dependent and leaves dead entries in the lockfile, so keep the two entries together.
// Remove both when those dependencies stop requiring node-domexception.
module.exports = globalThis.DOMException;
