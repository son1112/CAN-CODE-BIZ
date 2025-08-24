#!/usr/bin/env bash

# Deployment script for Rubber Ducky Live
# Usage: ./scripts/deploy.sh [environment] [options]
# Environments: test, staging, production

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project mappings (using functions instead of associative arrays for compatibility)
get_project() {
    case $1 in
        "test") echo "rubber-ducky-live-test" ;;
        "staging") echo "rubber-ducky-live-alpha" ;;
        "production") echo "rubber-ducky-live" ;;
        *) echo "" ;;
    esac
}

get_url() {
    case $1 in
        "test") echo "https://rubber-ducky-live-test-can-code-alpha-projects.vercel.app" ;;
        "staging") echo "https://rubber-ducky-live-alpha-can-code-alpha-projects.vercel.app" ;;
        "production") echo "https://rubber-ducky-live.vercel.app" ;;
        *) echo "" ;;
    esac
}

get_branches() {
    case $1 in
        "test") echo "develop,feature/*" ;;
        "staging") echo "develop" ;;
        "production") echo "main" ;;
        *) echo "" ;;
    esac
}

# Functions
print_usage() {
    echo -e "${BLUE}Rubber Ducky Live Deployment Script${NC}"
    echo ""
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  test        Deploy to test environment (rubber-ducky-live-test)"
    echo "  staging     Deploy to staging environment (rubber-ducky-live-alpha)"
    echo "  production  Deploy to production environment (rubber-ducky-live)"
    echo ""
    echo "Options:"
    echo "  --dry-run   Show what would be deployed without actually deploying"
    echo "  --force     Skip branch validation and deploy anyway"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 staging                    # Deploy current branch to staging"
    echo "  $0 production --dry-run       # Preview production deployment"
    echo "  $0 test --force              # Force deploy to test (skip branch check)"
}

validate_environment() {
    local env=$1
    local project=$(get_project "$env")
    if [[ -z "$project" ]]; then
        echo -e "${RED}Error: Invalid environment '$env'${NC}"
        echo "Valid environments: test, staging, production"
        exit 1
    fi
}

check_branch() {
    local env=$1
    local current_branch=$(git branch --show-current)
    local expected_branches=$(get_branches "$env")
    
    echo -e "${BLUE}Current branch: ${current_branch}${NC}"
    
    case $env in
        "production")
            if [[ "$current_branch" != "main" ]]; then
                echo -e "${RED}Error: Production deploys must be from 'main' branch${NC}"
                echo -e "Current branch: ${current_branch}"
                echo -e "Switch to main: ${YELLOW}git checkout main${NC}"
                return 1
            fi
            ;;
        "staging")
            if [[ "$current_branch" != "develop" ]]; then
                echo -e "${YELLOW}Warning: Staging typically deploys from 'develop' branch${NC}"
                echo -e "Current branch: ${current_branch}"
                if [[ "$FORCE" != "true" ]]; then
                    echo -e "Use --force to deploy anyway or switch to develop: ${YELLOW}git checkout develop${NC}"
                    return 1
                fi
            fi
            ;;
        "test")
            echo -e "${BLUE}Test environment accepts any branch${NC}"
            ;;
    esac
    return 0
}

check_git_status() {
    if ! git diff-index --quiet HEAD --; then
        echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
        if [[ "$FORCE" != "true" ]]; then
            echo "Commit your changes or use --force to deploy anyway"
            return 1
        fi
    fi
    return 0
}

deploy_to_vercel() {
    local env=$1
    local project=$(get_project "$env")
    local url=$(get_url "$env")
    
    echo -e "${BLUE}Deploying to ${env} environment...${NC}"
    echo -e "Project: ${project}"
    echo -e "URL: ${url}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would execute:${NC}"
        echo "vercel link --project ${project} --yes --scope can-code-alpha-projects"
        echo "vercel --prod --yes"
        return 0
    fi
    
    # Execute deployment
    echo -e "${BLUE}Executing deployment...${NC}"
    
    # Backup current project configuration
    if [[ -f .vercel/project.json ]]; then
        cp .vercel/project.json .vercel/project.json.backup
    fi
    
    # Link to target project temporarily
    echo -e "${BLUE}Linking to project: ${project}${NC}"
    if ! vercel link --project "$project" --yes --scope can-code-alpha-projects; then
        echo -e "${RED}Failed to link to project ${project}${NC}"
        return 1
    fi
    
    # Deploy
    if vercel --prod --yes; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        echo -e "🌐 URL: ${url}"
        
        # Trigger visual notification
        touch ~/.claude-flash-trigger
        
        # Health check
        echo -e "${BLUE}Performing health check...${NC}"
        sleep 5
        if curl -f -s "${url}/api/health" > /dev/null; then
            echo -e "${GREEN}✅ Health check passed${NC}"
        else
            echo -e "${YELLOW}⚠️ Health check failed (this might be normal during startup)${NC}"
        fi
        
        # Restore original project configuration
        if [[ -f .vercel/project.json.backup ]]; then
            mv .vercel/project.json.backup .vercel/project.json
            echo -e "${BLUE}Restored original project configuration${NC}"
        fi
        
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        
        # Restore original project configuration on failure
        if [[ -f .vercel/project.json.backup ]]; then
            mv .vercel/project.json.backup .vercel/project.json
            echo -e "${BLUE}Restored original project configuration${NC}"
        fi
        
        return 1
    fi
}

# Main script
main() {
    local environment=""
    local DRY_RUN=false
    local FORCE=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            test|staging|production)
                environment="$1"
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --help|-h)
                print_usage
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                print_usage
                exit 1
                ;;
        esac
    done
    
    # Validate arguments
    if [[ -z "$environment" ]]; then
        echo -e "${RED}Error: Environment required${NC}"
        print_usage
        exit 1
    fi
    
    validate_environment "$environment"
    
    echo -e "${BLUE}🚀 Rubber Ducky Live Deployment${NC}"
    echo -e "Environment: ${environment}"
    echo -e "Project: $(get_project "$environment")"
    echo ""
    
    # Pre-deployment checks
    if ! check_git_status; then
        exit 1
    fi
    
    if ! check_branch "$environment"; then
        exit 1
    fi
    
    # Deploy
    if deploy_to_vercel "$environment"; then
        echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    else
        echo -e "${RED}💥 Deployment failed${NC}"
        exit 1
    fi
}

# Export variables for subfunctions
export DRY_RUN FORCE

# Run main function
main "$@"