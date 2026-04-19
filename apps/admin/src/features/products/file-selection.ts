const MAX_PRODUCT_IMAGES = 5;

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function mergeSelectedProductImages(currentFiles: File[], selectedFiles: File[]): File[] {
  const selectedByKey = new Set(currentFiles.map(fileKey));
  const mergedFiles = [...currentFiles];

  for (const file of selectedFiles) {
    const key = fileKey(file);
    if (!selectedByKey.has(key)) {
      selectedByKey.add(key);
      mergedFiles.push(file);
    }
  }

  return mergedFiles.slice(0, MAX_PRODUCT_IMAGES);
}

export function removeSelectedProductImage(currentFiles: File[], indexToRemove: number): File[] {
  return currentFiles.filter((_, index) => index !== indexToRemove);
}

export { MAX_PRODUCT_IMAGES };
