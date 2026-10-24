import test from 'node:test';
import assert from 'node:assert/strict';
import { routeRequest, capabilities } from '../src/capabilities.js';

test('routes PDF requests to verified image-to-PDF', () => assert.deepEqual(routeRequest('Make a PDF from these images'), { capabilityId: 'image-to-pdf', strategy: 'verified' }));
test('routes CSV requests to registered data capability', () => assert.equal(routeRequest('Analyze this CSV spreadsheet').capabilityId, 'csv-summary'));
test('custom requests are marked as requiring a generation provider', () => assert.equal(routeRequest('Build a booking planner').requiresGenerationProvider, true));
test('registry includes the verified PDF tool', () => assert.ok(capabilities.some(c => c.id === 'image-to-pdf' && c.status === 'ready')));
