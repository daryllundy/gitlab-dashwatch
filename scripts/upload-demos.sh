#!/bin/bash

# GitLab DashWatch - Upload Asciinema Demos Script
# This script uploads all demo recordings to asciinema.org

set -e

DEMOS_DIR="docs/demos"
UPLOAD_LOG="demos-upload.log"

echo "🎬 GitLab DashWatch Demo Upload Script"
echo "======================================"
echo ""

# Check if asciinema is installed
if ! command -v asciinema &> /dev/null; then
    echo "❌ asciinema is not installed. Please install it first:"
    echo "   npm install -g asciinema"
    exit 1
fi

# Check if demos directory exists
if [ ! -d "$DEMOS_DIR" ]; then
    echo "❌ Demos directory not found: $DEMOS_DIR"
    exit 1
fi

# Initialize upload log
echo "# GitLab DashWatch Demo Upload Log" > "$UPLOAD_LOG"
echo "Generated on: $(date)" >> "$UPLOAD_LOG"
echo "" >> "$UPLOAD_LOG"

echo "📁 Found demo files in $DEMOS_DIR:"
echo ""

# List available demo files
for demo in "$DEMOS_DIR"/*.cast; do
    if [ -f "$demo" ]; then
        filename=$(basename "$demo")
        echo "  ✓ $filename"
    fi
done

echo ""
echo "🚀 Starting upload process..."
echo ""

# Upload each demo file
for demo in "$DEMOS_DIR"/*.cast; do
    if [ -f "$demo" ]; then
        filename=$(basename "$demo")
        demo_name=$(basename "$demo" .cast)
        
        echo "📤 Uploading $filename..."
        
        # Upload to asciinema.org and capture the URL
        if upload_result=$(asciinema upload "$demo" 2>&1); then
            # Extract URL from output (asciinema returns the URL)
            demo_url=$(echo "$upload_result" | grep -o 'https://asciinema.org/a/[a-zA-Z0-9]*' || echo "Upload successful but URL not captured")
            
            echo "  ✅ Success: $demo_url"
            
            # Log the result
            echo "## $demo_name" >> "$UPLOAD_LOG"
            echo "- File: $filename" >> "$UPLOAD_LOG"
            echo "- URL: $demo_url" >> "$UPLOAD_LOG"
            echo "- Uploaded: $(date)" >> "$UPLOAD_LOG"
            echo "" >> "$UPLOAD_LOG"
        else
            echo "  ❌ Failed to upload $filename"
            echo "  Error: $upload_result"
            
            # Log the failure
            echo "## $demo_name (FAILED)" >> "$UPLOAD_LOG"
            echo "- File: $filename" >> "$UPLOAD_LOG"
            echo "- Error: $upload_result" >> "$UPLOAD_LOG"
            echo "- Attempted: $(date)" >> "$UPLOAD_LOG"
            echo "" >> "$UPLOAD_LOG"
        fi
        
        echo ""
    fi
done

echo "📋 Upload log saved to: $UPLOAD_LOG"
echo ""
echo "🎯 Next steps:"
echo "  1. Review the upload log for URLs"
echo "  2. Update README.md with the asciinema URLs"
echo "  3. Test the embedded players"
echo ""
echo "✅ Demo upload process complete!"