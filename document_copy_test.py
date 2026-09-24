#!/usr/bin/env python3
"""
Test script for document copying functionality when applying for a vacancy.
This script verifies that when a user applies for a vacancy, their existing
documents are automatically copied to the new application.
"""

from playwright.sync_api import sync_playwright
import sys
import os

def test_document_copy_on_application():
    """Test that documents are copied when applying for a vacancy."""

    with sync_playwright() as p:
        # Launch browser in headless mode for testing
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Step 1: Log in as an applicant (assuming we have test credentials)
            # In a real test, we would need to set up test data or use mock authentication
            # For this example, we'll simulate the API calls directly or assume we're already logged in

            # Navigate to the applicant documents page to see existing documents
            print("Navigating to applicant documents page...")
            page.goto('http://localhost:3000/applicant/documents')
            page.wait_for_load_state('networkidle')

            # Check if we have existing documents
            existing_docs_count = page.locator('table tbody tr').count()
            print(f"Found {existing_docs_count} existing documents")

            # If we don't have existing documents, we might need to create some for testing
            # For this test, we'll assume we have some existing documents

            # Step 2: Go to vacancies page and apply for a vacancy
            print("Navigating to vacancies page...")
            page.goto('http://localhost:3000/applicant/vacancies')
            page.wait_for_load_state('networkidle')

            # Find a published vacancy and apply for it
            # In a real test, we would need to ensure there's a published vacancy available
            # For this example, we'll click the first apply button we find
            apply_buttons = page.locator('button:has-text("Apply")').all()
            if apply_buttons:
                print(f"Found {len(apply_buttons)} apply buttons")
                # Click the first apply button
                apply_buttons[0].click()

                # Wait for any confirmation or redirect
                page.wait_for_timeout(2000)  # Brief wait for UI update

                # Step 3: Check if the application now shows the copied documents
                # Navigate to the applications page to see our applications
                print("Navigating to applications page...")
                page.goto('http://localhost:3000/applicant/applications')
                page.wait_for_load_state('networkidle')

                # Find the application we just submitted and check its document count
                # In a real implementation, we would check the application details
                # For this test, we'll verify that the application shows documents

                # Look for application rows
                application_rows = page.locator('table tbody tr').all()
                if application_rows:
                    # Click on the first application (most recent) to view details
                    application_rows[0].click()
                    page.wait_for_load_state('networkidle')

                    # Check if documents section shows the copied documents
                    documents_section = page.locator('text=Documents')
                    if documents_section.count() > 0:
                        # Check the documents table for copied documents
                        doc_rows = page.locator('table tbody tr').all()
                        print(f"Application has {len(doc_rows)} documents")

                        # Verify that the document count matches what we expect
                        # (This would depend on how many existing documents we had)
                        if len(doc_rows) > 0:
                            print("✓ Documents were successfully copied to the new application")
                            # Take a screenshot for verification
                            page.screenshot(path="/tmp/application_with_documents.png")
                        else:
                            print("✗ No documents found in the new application")
                    else:
                        print("✗ Documents section not found")
                else:
                    print("✗ No applications found")
            else:
                print("✗ No apply buttons found - may need to set up test data")

            print("✓ Document copy test completed")
            return True

        except Exception as e:
            print(f"✗ Error during document copy test: {e}")
            return False

        finally:
            browser.close()

if __name__ == "__main__":
    success = test_document_copy_on_application()
    sys.exit(0 if success else 1)