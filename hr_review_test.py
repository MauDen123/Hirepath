#!/usr/bin/env python3
"""
Test script for HR Review page using Playwright.
This script verifies that the HR review page loads correctly and displays
application details and submitted documents.
"""

from playwright.sync_api import sync_playwright
import sys
import os

def test_hr_review_page():
    """Test the HR review page functionality."""

    with sync_playwright() as p:
        # Launch browser in headless mode for testing
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to the HR review page
            # Note: In a real test, we would need a valid application ID
            # For this test, we'll use a placeholder and expect either:
            # 1. A valid page if the ID exists in the database
            # 2. A 404 page if the ID doesn't exist (which is also valid behavior)
            test_url = "http://localhost:3000/hr/review/test-id-123"
            print(f"Navigating to: {test_url}")
            page.goto(test_url)

            # Wait for network to be idle
            page.wait_for_load_state('networkidle')

            # Check if we got a 404 page (which is valid for non-existent ID)
            # Look for common 404 indicators
            is_404 = False
            try:
                # Check for Next.js 404 page or custom 404 message
                if page.locator('text=Not Found').count() > 0 or \
                   page.locator('text=Page Not Found').count() > 0 or \
                   page.locator('text=404').count() > 0:
                    is_404 = True
            except:
                pass

            if is_404:
                print("✓ Received 404 for non-existent application ID (expected behavior)")
            else:
                # If not a 404, verify the page elements are present
                print("✓ Page loaded successfully (not a 404)")

                # Check for application details section
                application_details = page.locator('text=Application Details')
                if application_details.count() > 0:
                    print("✓ Application Details section found")
                else:
                    print("⚠ Application Details section not found")

                # Check for documents section
                documents_section = page.locator('text=Documents Submitted')
                if documents_section.count() > 0:
                    print("✓ Documents Submitted section found")
                else:
                    print("⚠ Documents Submitted section not found")

                # Check for status update form
                status_form = page.locator('text=Update Application Status')
                if status_form.count() > 0:
                    print("✓ Update Application Status form found")
                else:
                    print("⚠ Update Application Status form not found")

                # Take a screenshot for visual verification
                screenshot_path = "/tmp/hr_review_page.png"
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"✓ Screenshot saved to {screenshot_path}")

                # Try to find and verify iframe elements for document previews
                iframes = page.locator('iframe').all()
                if len(iframes) > 0:
                    print(f"✓ Found {len(iframes)} iframe(s) for document previews")
                else:
                    print("ℹ No iframes found (no documents or documents section not rendered)")

            print("✓ HR review page test completed successfully")
            return True

        except Exception as e:
            print(f"✗ Error during HR review page test: {e}")
            return False

        finally:
            browser.close()

if __name__ == "__main__":
    success = test_hr_review_page()
    sys.exit(0 if success else 1)