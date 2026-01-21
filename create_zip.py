import os
import zipfile
import fnmatch
from datetime import datetime

def create_zip(source_dir, zip_filepath):
    """
    Creates a zip archive of the source directory, respecting .gitignore patterns and
    excluding specific files and directories.
    """
    print(f"Creating zip for AI Studio from: {source_dir}")

    # File patterns to exclude
    exclude_patterns = [
        'yazi-quest-ai-studio*.zip',
        'create_zip.py',
        '*.pyc',
        '__pycache__',
        '*.swp',
        '*.swo',
        '*.log',
        'npm-debug.log*',
        'yarn-debug.log*',
        'yarn-error.log*',
        'pnpm-debug.log*',
        'lerna-debug.log*',
        '*.local',
        '.DS_Store',
        '*.suo',
        '*.ntvs*',
        '*.njsproj',
        '*.sln',
        'swappy-*.png',
        'Screenshot*.png',
    ]

    with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(source_dir, topdown=True):
            # Per user instruction, hardcode exclusion of these directories
            if root == source_dir:
                dirs[:] = [
                    d for d in dirs
                    if d not in ['.git', 'node_modules', '.husky', 'dist', 'dist-ssr', 'playwright-report', 'test-results', '.idea', '.playwright', 'videos', 'screenshots', 'traces']
                ]

            # Special handling for .vscode
            if '.vscode' in dirs:
                vscode_path = os.path.join(root, '.vscode')
                for vscode_root, _, vscode_files in os.walk(vscode_path):
                    for file in vscode_files:
                        if file != 'extensions.json':
                            # just add extensions.json
                            pass
                # remove .vscode from dirs so we don't traverse it further
                dirs.remove('.vscode')
                # manually add the one file we want
                extensions_json_path = os.path.join(vscode_path, 'extensions.json')
                if os.path.exists(extensions_json_path):
                     rel_path = os.path.relpath(extensions_json_path, source_dir)
                     print(f"Adding: {rel_path}")
                     zf.write(extensions_json_path, rel_path)


            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, source_dir)

                if any(fnmatch.fnmatch(file, pattern) for pattern in exclude_patterns):
                    continue

                if any(fnmatch.fnmatch(rel_path, pattern) for pattern in exclude_patterns):
                    continue
                
                print(f"Adding: {rel_path}")
                zf.write(file_path, rel_path)

if __name__ == "__main__":
    current_directory = os.getcwd()
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    output_zip = f"yazi-quest-ai-studio-{timestamp}.zip"
    create_zip(current_directory, output_zip)
    print(f"\nSuccessfully created {output_zip}")
