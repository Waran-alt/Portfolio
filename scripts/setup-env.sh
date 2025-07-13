#!/bin/bash

# =============================================================================
# ENVIRONMENT SETUP SCRIPT
# =============================================================================
# Purpose: Generates .env.* files from .env.*.example templates
# Features:
#   - Initial setup: Creates missing .env files from templates
#   - Force update: Overwrites existing .env files with template content
#   - Light update: Preserves existing variables while adding new ones
#   - Dry run: Shows what would be done without making changes
#   - Smart comparison: Detects when templates have changed
#
# Usage: ./scripts/setup-env.sh [OPTIONS]
# Options: --force, --light, --dry-run, --help

# Note: set -e is disabled to allow the loop to continue processing other files
# even if one file fails, providing better error reporting

# =============================================================================
# COLOR DEFINITIONS FOR OUTPUT
# =============================================================================
RED='\033[0;31m'      # Error messages
GREEN='\033[0;32m'    # Success messages
YELLOW='\033[1;33m'   # Warnings and notes
BLUE='\033[0;34m'     # Information and headers
NC='\033[0m'          # No Color (reset)

# =============================================================================
# PATH CONFIGURATION
# =============================================================================
# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root (parent of scripts directory)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
# Template directory where .env.*.example files are stored
TEMPLATE_DIR="$PROJECT_ROOT/documentation/env-templates"

# =============================================================================
# COMMAND LINE ARGUMENT PARSING
# =============================================================================
# Initialize flags for different operation modes
FORCE_UPDATE=false    # Overwrite existing .env files
DRY_RUN=false         # Show what would be done without making changes
LIGHT_UPDATE=false    # Preserve existing variables, add new ones

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force|-f)
            FORCE_UPDATE=true
            shift
            ;;
        --dry-run|-d)
            DRY_RUN=true
            shift
            ;;
        --light|-l)
            LIGHT_UPDATE=true
            shift
            ;;
        --help|-h)
            # Display help information and exit
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -f, --force     Force update existing .env files (overwrites all)"
            echo "  -l, --light     Light update: preserve existing vars, add new ones"
            echo "  -d, --dry-run   Show what would be done without making changes"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              # Create missing .env files only"
            echo "  $0 --force      # Update all .env files from templates (overwrites)"
            echo "  $0 --light      # Add new vars to existing files (preserves existing)"
            echo "  $0 --dry-run    # Show what would be updated"
            echo ""
            echo "Note: --force and --light are mutually exclusive"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# =============================================================================
# VALIDATION CHECKS
# =============================================================================
# Check for conflicting options (force and light are mutually exclusive)
if [[ "$FORCE_UPDATE" == "true" ]] && [[ "$LIGHT_UPDATE" == "true" ]]; then
    echo -e "${RED}❌ --force and --light are mutually exclusive${NC}"
    echo "Use --help for usage information"
    exit 1
fi

echo -e "${BLUE}🔧 Setting up environment files...${NC}"

# Verify template directory exists
if [[ ! -d "$TEMPLATE_DIR" ]]; then
    echo -e "${RED}❌ Template directory not found: $TEMPLATE_DIR${NC}"
    echo -e "${YELLOW}💡 Please create the directory and add .env.*.example files${NC}"
    exit 1
fi

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Function: extract_variables
# Purpose: Extract variable names from environment files
# Input: File path
# Output: Sorted list of variable names (without values)
extract_variables() {
    local file="$1"
    if [[ -f "$file" ]]; then
        # Find lines that contain variable assignments (KEY=value)
        # Exclude comments and empty lines
        # Extract only the variable name (before the =)
        # Remove duplicates and sort
        grep -E '^[^#]*[A-Z_][A-Z0-9_]*=' "$file" | sed 's/=.*//' | sort -u
    fi
}

# Function: merge_env_files
# Purpose: Merge template content with existing .env file (light update mode)
# Input: Template file path, target .env file path, template name for display
# Behavior: Preserves existing variables not in template, adds new variables from template
merge_env_files() {
    local template_file="$1"
    local env_file="$2"
    local template_name="$3"
    
    # Validate template file exists
    if [[ ! -f "$template_file" ]]; then
        echo -e "${RED}❌ Template not found: $template_name${NC}"
        return 1
    fi
    
    # Create temporary files for processing
    local temp_file=$(mktemp)
    local backup_file=$(mktemp)
    
    # Extract variable names from both files
    local template_vars=$(extract_variables "$template_file")
    local existing_vars=""
    if [[ -f "$env_file" ]]; then
        existing_vars=$(extract_variables "$env_file")
    fi
    
    # Find differences between template and existing file
    # new_vars: Variables in template but not in existing file (to be added)
    # removed_vars: Variables in existing file but not in template (to be preserved)
    local new_vars=$(comm -23 <(echo "$template_vars") <(echo "$existing_vars"))
    local removed_vars=$(comm -13 <(echo "$template_vars") <(echo "$existing_vars"))
    
    # Handle dry run mode - just show what would be done
    if [[ "$DRY_RUN" == "true" ]]; then
        if [[ -n "$new_vars" ]]; then
            echo -e "${BLUE}📄 Would add new variables to $env_file:${NC}"
            echo "$new_vars" | sed 's/^/  + /'
        fi
        if [[ -n "$removed_vars" ]]; then
            echo -e "${YELLOW}⚠️  Would preserve existing variables in $env_file:${NC}"
            echo "$removed_vars" | sed 's/^/  ~ /'
        fi
        if [[ -z "$new_vars" ]] && [[ -z "$removed_vars" ]]; then
            echo -e "${GREEN}✅ $env_file is up to date with $template_name (no changes needed)${NC}"
        fi
        return 0
    fi
    
    # Start with template content as the base
    cp "$template_file" "$temp_file"
    
    # Add existing variables that are not in the template (preserved variables)
    if [[ -f "$env_file" ]] && [[ -n "$removed_vars" ]]; then
        # Add a section header for preserved variables
        echo "" >> "$temp_file"
        echo "# =============================================================================" >> "$temp_file"
        echo "# PRESERVED VARIABLES" >> "$temp_file"
        echo "# =============================================================================" >> "$temp_file"
        echo "# These variables exist in your .env file but are not in the template" >> "$temp_file"
        echo "# They are preserved for backward compatibility" >> "$temp_file"
        echo "" >> "$temp_file"
        
        # Extract and add each preserved variable with its value
        while IFS= read -r var_name; do
            if [[ -n "$var_name" ]]; then
                # Get the full line (including value) from the existing file
                local full_line=$(grep "^$var_name=" "$env_file" | head -1)
                if [[ -n "$full_line" ]]; then
                    echo "$full_line" >> "$temp_file"
                fi
            fi
        done <<< "$removed_vars"
    fi
    
    # Create backup of existing file before making changes
    if [[ -f "$env_file" ]]; then
        cp "$env_file" "$backup_file"
    fi
    
    # Replace the env file with merged content
    if mv "$temp_file" "$env_file"; then
        # Report success with details
        if [[ -n "$new_vars" ]]; then
            echo -e "${GREEN}✅ Updated $env_file with new variables from $template_name${NC}"
            echo -e "${YELLOW}💡 Added variables: $(echo "$new_vars" | wc -l | tr -d ' ')${NC}"
        fi
        if [[ -n "$removed_vars" ]]; then
            echo -e "${BLUE}ℹ️  Preserved $(echo "$removed_vars" | wc -l | tr -d ' ') existing variables in $env_file${NC}"
        fi
        if [[ -z "$new_vars" ]] && [[ -z "$removed_vars" ]]; then
            echo -e "${GREEN}✅ $env_file is up to date with $template_name${NC}"
        fi
    else
        # Handle failure - restore backup if available
        echo -e "${RED}❌ Failed to update $env_file${NC}"
        if [[ -f "$backup_file" ]]; then
            mv "$backup_file" "$env_file"
        fi
        rm -f "$temp_file"
        return 1
    fi
    
    # Cleanup temporary files
    rm -f "$backup_file"
    return 0
}

# Function: files_different
# Purpose: Compare two files to see if they have different content
# Input: Two file paths to compare
# Output: "true" if files are different, "false" if they are the same
# Note: Ignores comments and empty lines for comparison
files_different() {
    local file1="$1"
    local file2="$2"
    
    # If either file doesn't exist, they are considered different
    if [[ ! -f "$file1" ]] || [[ ! -f "$file2" ]]; then
        return 0  # Different if one doesn't exist
    fi
    
    # Create temporary files for comparison
    local temp1=$(mktemp)
    local temp2=$(mktemp)
    
    # Remove comments and empty lines for comparison
    # This focuses on actual variable definitions
    grep -v '^[[:space:]]*#' "$file1" | grep -v '^[[:space:]]*$' > "$temp1"
    grep -v '^[[:space:]]*#' "$file2" | grep -v '^[[:space:]]*$' > "$temp2"
    
    # Compare the cleaned files
    if diff -q "$temp1" "$temp2" >/dev/null; then
        local different=false
    else
        local different=true
    fi
    
    # Cleanup temporary files
    rm "$temp1" "$temp2"
    echo "$different"
}

# Function: copy_template
# Purpose: Copy template file to .env file with appropriate logic based on mode
# Input: Template file path, target .env file path, template name for display
# Behavior: Handles different update modes (light, force, normal)
copy_template() {
    local template_file="$1"
    local env_file="$2"
    local template_name="$3"
    
    # Validate template file exists
    if [[ ! -f "$template_file" ]]; then
        echo -e "${RED}❌ Template not found: $template_name${NC}"
        return 1
    fi
    
    # Handle light update mode (preserve existing, add new)
    if [[ "$LIGHT_UPDATE" == "true" ]]; then
        merge_env_files "$template_file" "$env_file" "$template_name"
        return $?
    fi
    
    # Handle force update mode (overwrite existing)
    if [[ -f "$env_file" ]]; then
        # Check if template and existing file are different
        local different=$(files_different "$template_file" "$env_file")
        
        if [[ "$different" == "true" ]]; then
            if [[ "$FORCE_UPDATE" == "true" ]]; then
                if [[ "$DRY_RUN" == "true" ]]; then
                    echo -e "${YELLOW}🔄 Would update $env_file from $template_name (template changed)${NC}"
        else
                    # Overwrite the existing file with template content
                    if cp "$template_file" "$env_file"; then
                        echo -e "${GREEN}✅ Updated $env_file from $template_name${NC}"
                        echo -e "${YELLOW}⚠️  Note: You may need to update your values in $env_file${NC}"
                    else
                        echo -e "${RED}❌ Failed to update $env_file from $template_name${NC}"
                        return 1
                    fi
                fi
            else
                # Normal mode: skip if file exists and is different
                echo -e "${YELLOW}⚠️  Skipping $template_name (already exists: $env_file)${NC}"
                echo -e "${YELLOW}💡 Use --force to update from template, --light to merge, or --dry-run to see changes${NC}"
            fi
        else
            # Files are the same (ignoring comments/empty lines)
            echo -e "${GREEN}✅ $env_file is up to date with $template_name (no changes needed)${NC}"
        fi
    else
        # File doesn't exist - create it
        if [[ "$DRY_RUN" == "true" ]]; then
            echo -e "${BLUE}📄 Would create $env_file from $template_name${NC}"
        else
            if cp "$template_file" "$env_file"; then
                echo -e "${GREEN}✅ Created $env_file from $template_name${NC}"
            else
                echo -e "${RED}❌ Failed to create $env_file from $template_name${NC}"
                return 1
            fi
        fi
    fi
    
    return 0
}

# =============================================================================
# MAIN PROCESSING LOOP
# =============================================================================
echo -e "\n${BLUE}📋 Processing environment templates...${NC}"

# Initialize counters for summary
errors=0
created_count=0
updated_count=0
skipped_count=0
processed_files=()

# Show which templates were found
echo -e "${BLUE}🔍 Found templates:${NC}"
find "$TEMPLATE_DIR" -name "*.example" -type f -print0 | xargs -0 -n1 basename | sed 's/^/  • /'

# Process each .env.*.example file in the template directory
while IFS= read -r -d '' template_file; do
    # Extract just the filename from the full path
    template_name=$(basename "$template_file")
    
    # Parse the template name to extract service name
    # Expected format: env.{service}.example
    # Example: env.common.example -> service_name = "common"
    if [[ "$template_name" =~ ^env\.(.+)\.example$ ]]; then
        service_name="${BASH_REMATCH[1]}"
        env_file="$PROJECT_ROOT/.env.$service_name"
        
        echo -e "\n${BLUE}📄 Processing $template_name...${NC}"
        
        # Process the template and track results
        if copy_template "$template_file" "$env_file" "$template_name"; then
            processed_files+=("$template_name")
            
            # Count actions for summary (handles both dry run and actual execution)
            if [[ "$DRY_RUN" == "true" ]]; then
                # Count would-be actions in dry run mode
                if [[ ! -f "$env_file" ]]; then
                    ((created_count++))
                elif [[ "$FORCE_UPDATE" == "true" ]] || [[ "$LIGHT_UPDATE" == "true" ]]; then
                    ((updated_count++))
                else
                    ((skipped_count++))
                fi
            else
                # Count actual actions performed
                if [[ ! -f "$env_file" ]]; then
                    ((created_count++))
                elif [[ "$FORCE_UPDATE" == "true" ]] || [[ "$LIGHT_UPDATE" == "true" ]]; then
                    ((updated_count++))
                else
                    ((skipped_count++))
                fi
            fi
        else
            # Track errors but continue processing other files
            ((errors++))
            echo -e "${RED}❌ Error processing $template_name, continuing to next file...${NC}"
        fi
        echo -e "${YELLOW}--- Finished processing $template_name ---${NC}"
    else
        # Skip files that don't match the expected naming pattern
        echo -e "${YELLOW}⚠️  Skipping $template_name (doesn't match expected pattern)${NC}"
    fi
done < <(find "$TEMPLATE_DIR" -name "*.example" -type f -print0)

# =============================================================================
# SUMMARY AND EXIT
# =============================================================================
echo -e "\n${BLUE}📊 Setup Summary${NC}"

# Show all processed files for transparency
if [[ ${#processed_files[@]} -gt 0 ]]; then
    echo -e "${BLUE}📋 Processed files:${NC}"
    for file in "${processed_files[@]}"; do
        echo -e "  • $file"
    done
    echo ""
fi

# Display appropriate summary based on mode and results
if [[ $errors -eq 0 ]]; then
    if [[ "$DRY_RUN" == "true" ]]; then
        # Dry run summary - what would be done
        echo -e "${BLUE}🔍 Dry run results:${NC}"
        echo -e "${BLUE}   Would create: $created_count file(s)${NC}"
        echo -e "${BLUE}   Would update: $updated_count file(s)${NC}"
        echo -e "${BLUE}   Would skip: $skipped_count file(s)${NC}"
        echo -e "${YELLOW}💡 Run without --dry-run to apply changes${NC}"
    else
        # Actual execution summary - what was done
        if [[ $created_count -gt 0 ]]; then
            echo -e "${GREEN}✅ Created $created_count new environment file(s)${NC}"
        fi
        if [[ $updated_count -gt 0 ]]; then
            if [[ "$LIGHT_UPDATE" == "true" ]]; then
                echo -e "${GREEN}✅ Merged $updated_count environment file(s) (preserved existing variables)${NC}"
            else
                echo -e "${GREEN}✅ Updated $updated_count environment file(s)${NC}"
                echo -e "${YELLOW}⚠️  Please review and update your values in the modified files${NC}"
            fi
        fi
        if [[ $skipped_count -gt 0 ]]; then
            echo -e "${BLUE}ℹ️  Skipped $skipped_count file(s) (already exist and up to date)${NC}"
        fi
        echo -e "${YELLOW}💡 Start services to validate your configuration${NC}"
    fi
    echo -e "${GREEN}🎉 Environment setup complete!${NC}"
    exit 0
else
    # Error summary
    echo -e "${RED}❌ Setup completed with $errors error(s)${NC}"
    exit 1
fi
