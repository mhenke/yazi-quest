
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
                                 e.g., ['.git/', 'node_modules/', 'package-lock.json']
    """
    if exclude_patterns is None:
        exclude_patterns = []

    with zipfile.ZipFile(output_zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Remove excluded directories from dirs list to prevent walking into them
            dirs[:] = [d for d in dirs if os.path.join(root, d) != os.path.join(source_dir, '.git') and os.path.join(root, d) != os.path.join(source_dir, 'node_modules')]
            
            for file in files:
                file_path = os.path.join(root, file)
                # Create a relative path for the archive
                arcname = os.path.relpath(file_path, source_dir)

                # Check against exclude patterns
                excluded = False
                for pattern in exclude_patterns:
                    # Simple check for direct file/folder names or paths
                    if pattern.endswith('/') and arcname.startswith(pattern): # Folder pattern
                        excluded = True
                        break
                    elif '*' in pattern: # Wildcard pattern
                        import fnmatch
                        if fnmatch.fnmatch(os.path.basename(file_path), pattern) or fnmatch.fnmatch(arcname, pattern):
                            excluded = True
                            break
                    elif arcname == pattern: # Exact file pattern
                        excluded = True
                        break
                    elif os.path.basename(file_path) == pattern: # Just filename pattern
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

    # Define patterns to exclude
    # These are relative to the source_dir
    exclude = [
        '.git/', # Exclude the .git directory
        'node_modules/', # Exclude the node_modules directory
        'package-lock.json', # Exclude package-lock.json file
        'ai_debug_info.txt', # Exclude debug logs
        'yazi-quest-ai-studio*.zip', # Exclude any existing zip files
        'fzf-0.57.0-linux_amd64.tar.gz', # Exclude downloaded archives
        'fzf-0.57.0-linux_amd64.tar.gz.1',
        'index.css', # Exclude generated CSS
        'postcss.config.js', # Exclude config files
        'tailwind.config.js',
        'public/', # Exclude public directory
        'swappy-*.png', # Exclude swappy screenshots
        'Screenshot*.png', # Exclude screenshots
    ]

    print(f"Creating optimized zip for AI Studio from: {current_directory}")
    print(f"Excluding patterns: {exclude}")
    create_optimized_zip(current_directory, output_zip, exclude)
