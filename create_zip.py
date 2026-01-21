
import os
import zipfile
from datetime import datetime

def create_optimized_zip(source_dir, output_zip_name, exclude_patterns=None):
    """
    Creates a zip archive of the source_dir, excluding files/directories
    that match the exclude_patterns.

    Args:
        source_dir (str): The root directory to archive.
        output_zip_name (str): The name of the output zip file.
        exclude_patterns (list): A list of glob-style patterns to exclude.
    """
    if exclude_patterns is None:
        exclude_patterns = []

    with zipfile.ZipFile(output_zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Exclude directories based on patterns
            dirs[:] = [
                d for d in dirs
                if not any(
                    fnmatch.fnmatch(os.path.join(os.path.relpath(root, source_dir), d), pattern)
                    for pattern in exclude_patterns
                )
            ]

            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)

                # Check against exclude patterns
                excluded = False
                for pattern in exclude_patterns:
                    import fnmatch
                    if fnmatch.fnmatch(arcname, pattern):
                        excluded = True
                        break

                if not excluded:
                    zipf.write(file_path, arcname)
                    print(f"Added: {arcname}")
                else:
                    print(f"Excluded: {arcname}")

    print(f"\nSuccessfully created {output_zip_name}")

if __name__ == "__main__":
    current_directory = os.getcwd()

    # Generate timestamp for unique filename
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    output_zip = f"yazi-quest-ai-studio-{timestamp}.zip"

    # Define patterns to exclude that are in the repo but not desired in the zip
    exclude = [
        'yazi-quest-ai-studio*.zip', # Exclude any existing zip files
    ]

    # Read patterns from .gitignore and append them to the exclude list
    gitignore_path = os.path.join(current_directory, '.gitignore')
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    exclude.append(line)

    print(f"Creating optimized zip for AI Studio from: {current_directory}")
    print(f"Excluding patterns: {exclude}")
    create_optimized_zip(current_directory, output_zip, exclude)
