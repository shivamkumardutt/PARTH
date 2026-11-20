import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateCountryCode,
  validateStateCode
} from '../src/modules/student/student.service.js';

// COUNTRY VALIDATION

test('IN should be a valid country code', () => {
  assert.equal(validateCountryCode('IN'), true);
});

test('US should be a valid country code', () => {
  assert.equal(validateCountryCode('US'), true);
});

test('XX should be an invalid country code', () => {
  assert.equal(validateCountryCode('XX'), false);
});

test('Country code should reject invalid types', () => {
  assert.equal(validateCountryCode(123), false);
});

// STATE VALIDATION

test('Punjab should be valid for India', () => {
  assert.equal(validateStateCode('PB', 'IN'), true);
});

test('Maharashtra should be valid for India', () => {
  assert.equal(validateStateCode('MH', 'IN'), true);
});

test('California should be invalid for India', () => {
  assert.equal(validateStateCode('CA', 'IN'), false);
});

test('California should be valid for USA', () => {
  assert.equal(validateStateCode('CA', 'US'), true);
});

test('Invalid state code should return false', () => {
  assert.equal(validateStateCode('XX', 'IN'), false);
});

test('State validation should reject invalid types', () => {
  assert.equal(validateStateCode(123, 'IN'), false);
});
