import { test, expect } from '@playwright/test';
import { isCollageUUID } from '../src/lib/uuid';

test('should have a valid context ID', async ({ page }) => {
  await page.goto('http://localhost:5173/src/core/create-context/samples/index.html');
  const locator = await page.locator('[data-test-id="contextid"]');
  const id = await locator.innerText();
  expect(isCollageUUID(id)).toBe(true);
});
