# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an internal HR tool for generating AI-powered birthday messages for company employees. The application is a Vue 3 single-page interface that serves as the first step in a multi-stage workflow for processing employee data and generating personalized birthday content.

### Business Objectives
- Upload employee data files (.xlsx, .csv) containing birthday information
- Process and validate employee personal data and team assignments via API
- Enable human validation and correction of processed data
- Generate AI-powered birthday messages with corresponding images
- Deliver final birthday content to HR team via email

### Workflow Overview
1. **Data Upload** (Current Implementation): User uploads employee data file
2. **Data Processing**: API processes data and returns enriched employee information with team assignments
3. **Human Validation**: User reviews and corrects any data inconsistencies  
4. **Message Generation**: AI generates personalized birthday messages and images
5. **Content Delivery**: System emails generated content to HR team

### Application Areas
- **Team Names Management**: Interface for viewing and editing team name mappings (initial_name → correct_name). Users can list existing teams, edit team's correct names, and delete teams. Each action triggers database updates via API.
- **Image Generation Flow**: Complete workflow for processing employee data files, validation, and generating birthday messages
- **Processed Images Archive**: Comprehensive view of all lifetime processed birthday images with advanced search and filtering capabilities. Users can search by number, name, or team, filter by birthday month, and export data to CSV.

*Note: The Vue application now implements the full workflow including validation, Teams Management interface, and the Processed Images Archive.*

## Architecture

The application follows a component-based architecture with Vue 3 Composition API:

- **Main App Structure**: `src/App.vue` serves as the root component that orchestrates file upload, status management, and API communication through reactive state and event handling
- **File Processing Flow**: `src/components/FileUpload.vue` handles drag-and-drop file upload, Excel/CSV parsing with SheetJS, and date field normalization before emitting processed data to the parent
- **UI Component System**: Custom shadcn-vue components in `src/components/ui/` provide consistent styling using class-variance-authority and TailwindCSS design tokens
- **State Management**: Uses Vue 3's reactive system with `ref()` and `reactive()` for progress tracking, status messages, and results display

## Key Technical Details

- **Date Processing**: Converts Excel serial date numbers and Date objects to ISO strings for API compatibility (specifically for 'Data Nascimento' and 'Início Atividade' fields)
- **Error Handling**: Comprehensive error states for invalid file types, empty files, processing errors, and API failures
- **Styling System**: TailwindCSS with CSS variables for theming, using `cn()` utility function that merges clsx and tailwind-merge for conditional classes

## Development Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # ESLint with auto-fix for Vue, TS, JS files
npm run typecheck  # TypeScript compilation check without output
```

## API Integration

### Current Implementation
- **Endpoint**: `https://n8n.aijarvis.co/webhook/gsc/birthdays`
- **Method**: POST with JSON payload containing all processed rows
- **Data Format**: Array of objects where date fields are converted to ISO strings
- **Error Handling**: HTTP status codes and network errors are captured and displayed to user

### Complete API Ecosystem
The application integrates with a broader API system for the full birthday message workflow:

#### Process Employees Data
- **Endpoint**: `https://n8n.aijarvis.co/webhook/gsc/rhbd/process-employees-data`
- **Method**: POST
- **Purpose**: Processes uploaded employee data and enriches it with team assignments and personal information
- **Input**: Array of employee data objects from uploaded files
- **Output**: Enriched employee data with validated team assignments

#### Generate Birthday Images  
- **Endpoint**: `https://n8n.aijarvis.co/webhook/gsc/rhbd/generate-birthday-images`
- **Method**: POST
- **Purpose**: Generates AI-powered birthday messages and accompanying images
- **Input**: Array of validated employee data objects
- **Output**: Generated birthday content with image URLs and generation status
- **Response Format**:
  ```json
  {
    "generationResult": [
      {
        "number": "4990",
        "name": "ANA PINTO",
        "formattedDate": "06 de Fevereiro",
        "teamName": "DAF",
        "teamId": "23",
        "originalData": {},
        "validation": {
          "isValid": true,
          "errors": [],
          "warnings": []
        },
        "isEdited": false,
        "imageURL": "https://drive.google.com/file/d/1hXJjzV7YU8zb9MSQzmNip0I-18p5Qrcg/view?usp=drivesdk",
        "donwloadURL": "https://aspsczfundwkbavzpmmv.supabase.co/storage/v1/object/public/uploads/design-previews/17a791e0-36d0-46e4-b539-c8c0486d66ba.jpg",
        "generationStatus": {
          "status": true
        }
      }
    ]
  }
  ```

#### Teams Management APIs
- **Get All Teams**: `https://n8n.aijarvis.co/webhook/gsc/rhbd/get-all-teams`
  - **Method**: GET
  - **Purpose**: Retrieve all team name mappings from the database
  - **Input**: None
  - **Output**: Array containing an object with `allBrands` property that holds the teams data
  - **Response Format**: 
    ```json
    [
      {
        "allBrands": [
          {
            "id": 1,
            "initial_name": "Team Name",
            "correct_name": "Corrected Team Name",
            "created_at": "2026-01-27T16:40:21.133Z",
            "updated_at": "2026-01-27T16:40:21.133Z"
          }
        ]
      }
    ]
    ```
- **Update Team**: `https://n8n.aijarvis.co/webhook/gsc/rhbd/update-team`
  - **Method**: POST
  - **Purpose**: Create or update team name mappings in the database
  - **Input**: Array of team objects with team data
  - **Output**: Success/failure response
- **Delete Team**: `https://n8n.aijarvis.co/webhook/gsc/rhbd/delete-team`  
  - **Method**: POST
  - **Purpose**: Remove team mappings from the database
  - **Input**: Array of team objects to delete
  - **Output**: Success/failure response

#### Archive Management API
- **Get All Collaborators**: `https://n8n.aijarvis.co/webhook/gsc/rhbd/get-all-collaborators`
  - **Method**: GET
  - **Purpose**: Retrieve all lifetime processed collaborators with birthday images
  - **Input**: None
  - **Output**: Array of collaborator objects with image information
  - **Response Format**:
    ```json
    {
      "collaborators": [
        {
          "id": 69,
          "name": "ANA PINTO",
          "team": "DAF",
          "image_url": "https://drive.google.com/file/d/12khs6Axm26ksEiJq01QnZAIF1Qdzo4ao/view?usp=drivesdk",
          "created_at": "2026-01-30T09:35:55.746Z",
          "number": "4990",
          "birthday_date": "06 de Fevereiro"
        }
      ]
    }
    ```

## Database Schema

### Teams Table
The application relies on a teams table for managing team name mappings:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Unique identifier for the team |
| `initial_name` | TEXT | Original team name as it appears in uploaded data |
| `correct_name` | TEXT | Standardized/correct team name for display |
| `created_at` | DATETIME | Record creation timestamp |
| `updated_at` | DATETIME | Last modification timestamp |

**Purpose**: Maps inconsistent team names from uploaded employee data to standardized team names. This supports the data validation workflow where users can correct team assignments. The Teams Management interface allows CRUD operations on this table.

## Component Communication Pattern

The app uses Vue's emit/props pattern for parent-child communication:
- `FileUpload` emits: `file-processed`, `status-change`, `progress-update`
- `App` handles these events to update global state and trigger API calls
- UI components receive data via props and use slots for content projection
