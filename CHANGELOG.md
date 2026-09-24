# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Comprehensive document processing infrastructure with OCR capabilities
- Tesseract.js integration for image OCR processing (JPG, JPEG, PNG, BMP, TIFF)
- PDF.js + canvas integration for PDF OCR processing (page-by-page with scaling for accuracy)
- Structured data extraction for PDS (Personal Data Sheet) forms:
  - Name extraction (full name, first/middle/last name)
  - Date of birth, place of birth, sex, civil status
  - Height, weight, address, contact information
  - Education, civil service eligibility
- Structured data extraction for WES (Work Experience Sheet) forms:
  - Employer name, position title, inclusive dates
  - Salary grade, monthly salary, appointment status
  - Government service information
- Confidence scoring system combining OCR quality and extraction accuracy
- Automatic handling of multi-page PDF documents
- Graceful fallback for unsupported file types (DOC, DOCX, etc.)

### Changed
- Updated document processing API to return structured data with confidence scores
- Enhanced document upload route to utilize new processing capabilities
- Updated HR review page to display parsing confidence scores for documents
- Improved TypeScript definitions and error handling throughout
- Updated dependencies to resolve ESLint conflicts (eslint@^9)

### Fixed
- ESLint Dependency Conflict: eslint-config-next@16.3.4 requires eslint@>=9.0.0
- Test Mock Issues: Added missing session object mocks in auth route tests
- JSX Syntax Error: Corrected fields=[...] to fields={ [...] in ScoreForm.tsx
- Module Resolution Error: Fixed import path to ./actions.ts in CRRC evaluations
- TypeScript Errors: Fixed Tesseract.js API usage and worker initialization
- All 19 tests now pass consistently

### Files Modified
- `src/lib/documentProcessing.ts` - New file with complete OCR and extraction implementation
- `src/app/api/documents/route.ts` - Enhanced to use document processing and store results
- `src/app/hr/review/[id]/page.tsx` - Updated to display parsing confidence scores for documents
- `src/app/crrc-evaluations/ScoreForm.tsx` - Fixed JSX syntax error
- `src/app/api/auth/login/__tests__/route.test.ts` - Fixed test mocks
- `src/app/api/auth/register/__tests__/route.test.ts` - Fixed test expectations
- `src/app/api/applications.route.test.ts` - Fixed import paths
- `tsconfig.json` - Updated TypeScript configuration
- `package.json` & `package-lock.json` - Updated dependencies
- `CHANGELOG.md` - Added this changelog entry

## [Previous Version] - (Before Phase 1 Enhancements)
- Initial application structure with basic authentication and routing
- Document upload functionality without OCR or structured data extraction
- Basic CRRC evaluation system
- Applicant and HR interfaces
- Vacancy management system