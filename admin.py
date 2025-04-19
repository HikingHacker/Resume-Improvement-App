#!/usr/bin/env python3
'''
Resume Improvement Tool Admin Script
-----------------------------------
This script automates common admin tasks for the Resume Improvement Tool project.

Available commands:
- deploy-frontend: Deploy frontend to GitHub Pages
- deploy-backend: Deploy backend to Heroku
- deploy-all: Deploy both frontend and backend
- status: Check status of deployments
'''

import os
import sys
import subprocess
import shutil
import json
from datetime import datetime

# Project paths
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.join(PROJECT_ROOT, 'server')

# Git remotes
GITHUB_REMOTE = "master"  # Your GitHub remote name
HEROKU_REMOTE = "heroku"  # Your Heroku remote name

# URLs
GITHUB_USERNAME = "HikingHacker"
REPO_NAME = "Resume-Improvement-App"
GITHUB_PAGES_URL = f"https://{GITHUB_USERNAME}.github.io/{REPO_NAME}"
GITHUB_REPO_URL = f"git@github.com:{GITHUB_USERNAME}/{REPO_NAME}.git"
HEROKU_APP_NAME = "resume-improvement-api-b20bfe5902cf"
HEROKU_URL = f"https://{HEROKU_APP_NAME}.herokuapp.com"
HEROKU_API_HEALTH_URL = f"{HEROKU_URL}/api/health"

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}=== {text} ==={Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.ENDC}")

def run_command(command, cwd=None, check=True):
    """Run a shell command and return its output"""
    try:
        result = subprocess.run(
            command,
            cwd=cwd or PROJECT_ROOT,
            check=check,
            shell=True,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {command}")
        print(e.stderr)
        if check:
            sys.exit(1)
        return None, e.stderr, e.returncode

def check_git_status():
    """Check if the git repository has uncommitted changes"""
    stdout, _, _ = run_command("git status --porcelain")
    return stdout.strip() != ""

def deploy_frontend():
    """Deploy the frontend to GitHub Pages"""
    print_header("Deploying Frontend to GitHub Pages")
    
    # Check if there are uncommitted changes
    if check_git_status():
        print_warning("There are uncommitted changes in the repository.")
        response = input("Do you want to continue anyway? (y/n): ").lower()
        if response != 'y':
            print_info("Deployment cancelled.")
            return False
    
    # Build the frontend
    print_info("Building frontend...")
    stdout, stderr, code = run_command("npm run build", check=False)
    
    if code != 0:
        print_error("Frontend build failed:")
        print(stderr)
        return False
    
    print_success("Frontend built successfully")
    
    # Deploy to GitHub Pages
    print_info("Deploying to GitHub Pages...")
    stdout, stderr, code = run_command(
        f"npx gh-pages -d build -r {GITHUB_REPO_URL}", 
        check=False
    )
    
    if code != 0:
        print_error("GitHub Pages deployment failed:")
        print(stderr)
        return False
    
    print_success("Frontend deployed to GitHub Pages")
    print_info(f"Frontend URL: {GITHUB_PAGES_URL}")
    return True

def deploy_backend():
    """Deploy the backend to Heroku"""
    print_header("Deploying Backend to Heroku")
    
    # Check if there are uncommitted changes
    if check_git_status():
        print_warning("There are uncommitted changes in the repository.")
        response = input("Do you want to commit them before deployment? (y/n): ").lower()
        if response == 'y':
            commit_msg = input("Enter commit message: ")
            run_command(f'git add .')
            run_command(f'git commit -m "{commit_msg}"')
            print_success("Changes committed")
    
    # Push to Heroku
    print_info("Deploying to Heroku...")
    stdout, stderr, code = run_command(f"git push {HEROKU_REMOTE} main", check=False)
    
    if code != 0:
        print_error("Heroku deployment failed:")
        print(stderr)
        return False
    
    print_success("Backend deployed to Heroku")
    print_info(f"Backend API URL: {HEROKU_URL}")
    return True

def check_status():
    """Check the status of the deployments"""
    print_header("Checking Deployment Status")
    
    # Check GitHub Pages
    print_info("Checking GitHub Pages status...")
    try:
        import requests
        response = requests.get(GITHUB_PAGES_URL, timeout=10)
        if response.status_code == 200:
            print_success("GitHub Pages is up and running")
        else:
            print_warning(f"GitHub Pages returned status code: {response.status_code}")
    except Exception as e:
        print_error(f"Could not connect to GitHub Pages: {str(e)}")
    
    # Check Heroku
    print_info("Checking Heroku status...")
    try:
        import requests
        response = requests.get(HEROKU_API_HEALTH_URL, timeout=10)
        if response.status_code == 200:
            print_success("Heroku API is up and running")
            try:
                data = response.json()
                print_info(f"API Status: {json.dumps(data, indent=2)}")
            except:
                pass
        else:
            print_warning(f"Heroku API returned status code: {response.status_code}")
    except Exception as e:
        print_error(f"Could not connect to Heroku API: {str(e)}")
    
    # Check git status
    stdout, _, _ = run_command("git status -s")
    if stdout:
        print_warning("You have uncommitted changes:")
        print(stdout)
    else:
        print_success("Git repository is clean")

def update_dependencies():
    """Update npm dependencies"""
    print_header("Updating Dependencies")
    
    # Update frontend dependencies
    print_info("Updating frontend dependencies...")
    stdout, stderr, code = run_command("npm update", check=False)
    
    if code != 0:
        print_error("Frontend dependency update failed:")
        print(stderr)
    else:
        print_success("Frontend dependencies updated")
    
    # Update backend dependencies
    print_info("Updating backend dependencies...")
    stdout, stderr, code = run_command("npm update", cwd=SERVER_DIR, check=False)
    
    if code != 0:
        print_error("Backend dependency update failed:")
        print(stderr)
    else:
        print_success("Backend dependencies updated")

def create_backup():
    """Create a backup of the project"""
    print_header("Creating Backup")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup_{timestamp}"
    
    # Check if there are uncommitted changes
    if check_git_status():
        print_warning("There are uncommitted changes. These will be included in the backup.")
    
    try:
        # Create backup directory
        os.makedirs(backup_dir, exist_ok=True)
        
        # Use git archive for tracked files
        run_command(f"git archive HEAD | tar -x -C {backup_dir}")
        
        # Copy untracked files
        stdout, _, _ = run_command("git ls-files --others --exclude-standard")
        untracked_files = stdout.strip().split('\n')
        
        for file in untracked_files:
            if file:
                dest_dir = os.path.join(backup_dir, os.path.dirname(file))
                os.makedirs(dest_dir, exist_ok=True)
                if os.path.isfile(file):
                    shutil.copy2(file, os.path.join(backup_dir, file))
        
        # Create archive
        archive_name = f"{backup_dir}.tar.gz"
        run_command(f"tar -czf {archive_name} {backup_dir}")
        
        # Clean up
        shutil.rmtree(backup_dir)
        
        print_success(f"Backup created: {archive_name}")
    except Exception as e:
        print_error(f"Backup failed: {str(e)}")

def show_help():
    """Show help information"""
    print_header("Resume Improvement Tool Admin Script")
    print("Available commands:")
    print("  deploy-frontend   - Deploy frontend to GitHub Pages")
    print("  deploy-backend    - Deploy backend to Heroku")
    print("  deploy-all        - Deploy both frontend and backend")
    print("  status            - Check status of deployments")
    print("  update-deps       - Update npm dependencies")
    print("  backup            - Create a project backup")
    print("  help              - Show this help information")
    print("\nUsage: python admin.py [command]")

def main():
    if len(sys.argv) < 2:
        show_help()
        return

    command = sys.argv[1].lower()
    
    if command == "deploy-frontend":
        deploy_frontend()
    elif command == "deploy-backend":
        deploy_backend()
    elif command == "deploy-all":
        frontend_ok = deploy_frontend()
        backend_ok = deploy_backend()
        if frontend_ok and backend_ok:
            print_success("Both frontend and backend deployed successfully!")
        else:
            print_warning("There were issues with the deployment. Check the logs above.")
    elif command == "status":
        check_status()
    elif command == "update-deps":
        update_dependencies()
    elif command == "backup":
        create_backup()
    elif command in ["help", "--help", "-h"]:
        show_help()
    else:
        print_error(f"Unknown command: {command}")
        show_help()

if __name__ == "__main__":
    main()