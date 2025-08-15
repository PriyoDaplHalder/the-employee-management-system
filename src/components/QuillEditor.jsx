"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Skeleton } from "@mui/material";

const QuillEditor = ({
  value = "",
  onChange,
  readOnly = false,
  placeholder = "Enter description...",
  height = "200px",
}) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const QuillConstructorRef = useRef(null);
  const isUpdatingRef = useRef(false); // Track when we're updating programmatically
  const onChangeRef = useRef(onChange); // Store the latest onChange function
  const readOnlyRef = useRef(readOnly); // Store the latest readOnly value
  const placeholderRef = useRef(placeholder); // Store the latest placeholder value
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Update refs whenever props change
  useEffect(() => {
    onChangeRef.current = onChange;
    readOnlyRef.current = readOnly;
    placeholderRef.current = placeholder;
  }, [onChange, readOnly, placeholder]);

  useEffect(() => {
    // Dynamically import Quill only on client side
    const loadQuill = async () => {
      try {
        const QuillModule = await import("quill");
        await import("quill/dist/quill.snow.css");
        QuillConstructorRef.current = QuillModule.default;
        setIsLoading(false);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to load Quill:", error);
        setIsLoading(false);
      }
    };

    loadQuill();
  }, []);

  useEffect(() => {
    if (!QuillConstructorRef.current || !editorRef.current || quillRef.current)
      return;

    const toolbarOptions = [
      ["bold", "italic", "underline", "strike"],
      [{ header: [1, 2, 3, false] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link"],
    ];

    const quillInstance = new QuillConstructorRef.current(editorRef.current, {
      theme: "snow",
      readOnly: readOnlyRef.current,
      placeholder: placeholderRef.current,
      modules: {
        toolbar: readOnlyRef.current ? false : toolbarOptions,
      },
    });

    // Set initial content
    if (value) {
      isUpdatingRef.current = true;
      try {
        quillInstance.clipboard.dangerouslyPasteHTML(value);
      } catch (e) {
        quillInstance.setText(value);
      }
      // Reset flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 10);
    }

    // Listen for text changes
    if (!readOnlyRef.current) {
      quillInstance.on("text-change", () => {
        // Don't call onChange if we're updating programmatically
        if (isUpdatingRef.current) return;

        const editorElement = editorRef.current?.querySelector(".ql-editor");
        if (editorElement) {
          const html = editorElement.innerHTML;
          onChangeRef.current?.(html);
        }
      });
    }

    quillRef.current = quillInstance;

    return () => {
      if (quillRef.current) {
        try {
          quillRef.current.off && quillRef.current.off();
        } catch (e) {
          console.error("Error cleaning up Quill:", e);
        }
        quillRef.current = null;
      }
    };
  }, [isReady]);

  // Handle readOnly changes
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && value !== undefined) {
      const editorElement = editorRef.current?.querySelector(".ql-editor");
      const currentHtml = editorElement ? editorElement.innerHTML : "";

      if (value !== currentHtml) {
        isUpdatingRef.current = true; // Set flag to prevent onChange callback
        try {
          quillRef.current.clipboard.dangerouslyPasteHTML(value || "");
        } catch (e) {
          quillRef.current.setText(value || "");
        }
        // Reset flag after a short delay to allow Quill to process the change
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 10);
      }
    }
  }, [value]);

  if (isLoading) {
    return (
      <Box sx={{ width: "100%", height }}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height="56px"
          sx={{ mb: 1 }}
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={`calc(${height} - 56px)`}
        />
      </Box>
    );
  }

  if (!isReady) {
    return (
      <Box
        sx={{
          width: "100%",
          height,
          border: "1px solid #ccc",
          borderRadius: 1,
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
        }}
      >
        Failed to load editor
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: height }}>
      <div ref={editorRef} style={{ height }} />
    </Box>
  );
};

export default QuillEditor;
