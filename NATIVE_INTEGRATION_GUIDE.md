
# NeuralSS: Native Plugin Integration Specification

## 1. Overview

### 1.1. Purpose

This document provides the technical specification for the native Android (Kotlin) plugin required by the NeuralSS frontend. The frontend application is a Capacitor-based React SPA, and its core functionalities—on-device AI, filesystem access, and background operations—are entirely dependent on this native plugin.

### 1.2. The API Contract

The file `onDeviceAiPlugin.ts` serves as the single source of truth for the API contract. The native Kotlin plugin **must** implement the `OnDeviceAIPlugin` TypeScript interface, exposing the specified methods and adhering to the defined data structures.

---

## 2. API Contract: `OnDeviceAIPlugin` Methods

The following methods must be implemented in the native Kotlin plugin and exposed to the frontend via the Capacitor bridge under the name `OnDeviceAI`.

### 2.1. `initialize(): Promise<void>`

-   **Purpose:** Initializes the on-device AI model. This is a blocking operation for the app's startup sequence.
-   **Behavior:** The frontend calls this method once on application launch. The native implementation must handle the downloading (if necessary), preparation, and loading of the `gemma-3n-e2b-it-int4` model into memory, making it ready for subsequent inference calls.
-   **Success:** On successful model initialization, the promise must be resolved with no value (`call.resolve()`).
-   **Error Handling:** If initialization fails for any reason (e.g., no network, unsupported device), the promise **must** be rejected with a `NativeError` object (see Section 5). The frontend will display this error and provide a "Retry" mechanism.

### 2.2. `analyzeBatch(options: { imageUris: string[] }): Promise<AnalysisResult[]>`

-   **Purpose:** Analyzes a batch of screenshots for content, text, and entities. This is the primary workhorse method of the application.
-   **Parameters:**
    -   `imageUris: string[]`: An array of native file URIs (e.g., `"file:///path/to/image.png"`).
-   **Return Value:** A promise that resolves to an array of `AnalysisResult` objects. The schema for `AnalysisResult` is:
    ```typescript
    interface AnalysisResult {
      description: string | null;
      text: string | null;
      entities: {
        urls: string[];
        emails: string[];
        phoneNumbers: string[];
      } | null;
      category: string | null;
      error: string | null; // e.g., "FileReadError", "InferenceFailed"
    }
    ```
-   **Key Requirements:**
    1.  **Order Preservation:** The returned array of `AnalysisResult` objects **must** be in the exact same order as the input `imageUris` array. The frontend relies on this index-based mapping.
    2.  **Per-Image Error Handling:** An error in analyzing one image must not halt the entire batch. If a single image fails, its corresponding `AnalysisResult` object should have its `error` field populated with a descriptive string, and all other fields set to `null`.
-   **Error Handling:** If a critical, batch-wide error occurs, the entire promise must be rejected with a `NativeError` object.

### 2.3. `performSearch(options: { query: string }): Promise<{ screenshotIds: string[] }>`

-   **Purpose:** Performs an AI-driven semantic search over the indexed screenshot data.
-   **Parameters:**
    -   `query: string`: The user's search term.
-   **Behavior:** The native layer is expected to maintain an efficient search index. This method should use the AI model to compare the query's semantic meaning against the index.
-   **Return Value:** A promise that resolves to an object containing a single key, `screenshotIds`. The value is an array of screenshot IDs (file names) **ranked by relevance**.

### 2.4. `addToSearchIndex(options: { items: AnalyzedScreenshot[] })`

-   **Purpose:** Adds newly analyzed screenshot metadata to the native search index.
-   **Behavior:** This is a background task. The frontend calls this after a successful analysis batch. This operation should be asynchronous and not block the UI. Failures should be logged natively without rejecting the promise, as it is not a user-critical path.

### 2.5. `removeFromSearchIndex(options: { ids: string[] })`

-   **Purpose:** Removes screenshot metadata from the native search index.
-   **Behavior:** A background task called when a user deletes screenshots. Like `addToSearchIndex`, failures should be logged natively without rejecting the promise.

### 2.6. `cancelAnalysis(): Promise<void>`

-   **Purpose:** Provides a mechanism for the frontend to request cancellation of an in-progress `analyzeBatch` operation.
-   **Behavior:** The `analyzeBatch` implementation must be cancellable. It should periodically check a cancellation flag. If this method is called, the flag should be set, causing `analyzeBatch` to terminate prematurely and reject its promise with a `NativeError` where `code` is `'E_CANCELLED'`.

---

## 3. Native-to-Frontend Communication: Events

The plugin must use native filesystem observers (e.g., `FileObserver`) to monitor screenshot directories and emit events to the frontend.

-   **`'screenshotAdded'`**
    -   **Trigger:** A new screenshot file is created in a monitored directory.
    -   **Payload:** `{ fileName: string }`
-   **`'screenshotDeleted'`**
    -   **Trigger:** A screenshot file is deleted from a monitored directory.
    -   **Payload:** `{ fileName: string }`

---

## 4. Filesystem Integration

-   **Permissions:** The native `AndroidManifest.xml` must declare the `android.permission.READ_EXTERNAL_STORAGE` permission, which the frontend requests on startup.
-   **File URIs:** The plugin will exclusively receive native file URIs from the frontend. All file operations must be performed using these URIs.

---

## 5. Error Handling Contract

Consistent error handling is mandatory for a stable user experience. When any plugin method must fail, it **must** reject its promise with a structured `NativeError` object.

-   **Schema:**
    ```typescript
    interface NativeError {
      code: string;    // A machine-readable code (e.g., 'E_INIT_FAILED').
      message: string; // A human-readable message to be displayed to the user.
    }
    ```
-   **Usage:** This structure applies to all rejected promises from any method in the `OnDeviceAIPlugin` interface.

---

## 6. Implementation Checklist

-   [ ] Implement all methods from the `OnDeviceAIPlugin` interface in the native Kotlin plugin.
-   [ ] `initialize()` correctly loads the `gemma-3n-e2b-it-int4` model.
-   [ ] `analyzeBatch()` is performant, cancellable, preserves order, and handles per-image errors gracefully.
-   [ ] `performSearch()` returns a relevance-ranked array of screenshot IDs.
-   [ ] `addToSearchIndex` and `removeFromSearchIndex` function as non-blocking background tasks.
-   [ ] Native file observers are implemented and correctly emit `screenshotAdded` and `screenshotDeleted` events with the specified payload.
-   [ ] All rejected promises strictly adhere to the `NativeError` schema.
