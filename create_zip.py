import os
import zipfile
import fnmatch
from datetime import datetime

def create_zip_with_exclusions(source_dir, zip_filepath):
    """
    Creates a zip file from a source directory, respecting .gitignore patterns and
    excluding specified files and directories.
    """
    print(f"Creating optimized zip for AI Studio from: {source_dir}")

    exclude_patterns = [
        'yazi-quest-ai-studio*.zip', # Exclude any existing zip files
        '.git/',
        'create_zip.py',
        '*.pyc',
        '__pycache__/',
        '.DS_Store',
        '*.swp',
    ]

    # Process .gitignore
    gitignore_path = os.path.join(source_dir, '.gitignore')
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    exclude_patterns.append(line)

    # Prepare patterns for matching
    # We will have two lists: one for files and one for directories
    dir_patterns = []
    file_patterns = []

    for p in list(set(exclude_patterns)):
        if p.endswith('/'):
            dir_patterns.append(p.rstrip('/'))
        else:
            # Patterns without a slash can match a file or a directory
            dir_patterns.append(p)
            file_patterns.append(p)
    
    print(f"Directory exclusion patterns: {dir_patterns}")
    print(f"File exclusion patterns: {file_patterns}")

    with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir, topdown=True):
            rel_root = os.path.relpath(root, source_dir)
            if rel_root == '.':
                rel_root = ''

            # Filter directories
            # We iterate over a copy [:] because we are modifying it
            dirs[:] = [d for d in dirs if not is_path_excluded(os.path.join(rel_root, d), dir_patterns)]

            # Filter files
            for file in files:
                rel_path = os.path.join(rel_root, file)
                if not is_path_excluded(rel_path, file_patterns):
                    print(f"Adding: {rel_path}")
                    zipf.write(os.path.join(root, file), rel_path)


def is_path_excluded(path, patterns):
    """Checks if a path matches any of the glob patterns."""
    # Normalize path to use forward slashes for matching
    path_to_check = path.replace(os.sep, '/')
    for pattern in patterns:
        if fnmatch.fnmatch(path_to_check, pattern):
            return True
        if fnmatch.fnmatch(path_to_check, f"*/{pattern}"):
             return True
    return False

if __name__ == "__main__":
    current_directory = os.getcwd()
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    output_zip = f"yazi-quest-ai-studio-{timestamp}.zip"
    
    create_zip_with_exclusions(current_directory, output_zip)
    print(f"\nSuccessfully created {output_zip}")