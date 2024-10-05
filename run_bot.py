import subprocess
import sys
import os
import shutil

def check_command(command):
    path = shutil.which(command)
    print(f"Path for {command}: {path}")
    return path is not None

def run_command(command, cwd=None):
    print(f"Running command: {' '.join(command)}")
    print(f"Current working directory: {os.getcwd() if cwd is None else cwd}")
    try:
        result = subprocess.run(command, check=True, cwd=cwd, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Command failed with error code {e.returncode}")
        print(f"Error output: {e.stderr}")
        return False
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print(f"Command '{command[0]}' not found. Check if it's installed and in the system PATH.")
        return False

def run_bot():
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = script_dir
        bot_dir = os.path.join(project_root, 'bot')

        print(f"Script location: {os.path.abspath(__file__)}")
        print(f"Project root directory: {project_root}")
        print(f"Bot directory: {bot_dir}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"System PATH: {os.environ['PATH']}")

        if os.getcwd() != project_root:
            os.chdir(project_root)
            print(f"Changed to project root directory: {os.getcwd()}")
        
        print(f"Directory contents: {os.listdir()}")

        print("Pulling latest changes...")
        if not check_command("git"):
            print("Error: git is not installed or not in the system PATH.")
            return
        if not run_command(["git", "pull"]):
            return

        print("Installing dependencies...")
        npm_path = shutil.which("npm")
        if not npm_path:
            print("Error: npm is not installed or not in the system PATH.")
            print("Please install Node.js from https://nodejs.org/")
            return
        
        if not os.path.exists("package.json"):
            print("Error: package.json not found in the project root directory.")
            return
        
        if not run_command([npm_path, "install"]):
            return

        os.chdir(bot_dir)
        print(f"Changed to 'bot' directory: {os.getcwd()}")
        print(f"Bot directory contents: {os.listdir()}")

        if not os.path.exists("index.js"):
            print(f"Error: index.js not found in {os.getcwd()}")
            return

        print("Starting the bot...")
        if not run_command(["node", "index.js"]):
            return

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        print(f"Error details: {str(e)}")

if __name__ == "__main__":
    run_bot()
    input("Press Enter to exit...")