/**
 * Genearte the image size of an image Blob.
 */
export function computeImageSize(imageBlob) {
  const objectURL = window.URL.createObjectURL(imageBlob)
  const image = new Image();

  const sizePromise = new Promise(resolve => image.onload = i => {
    resolve({ height: image.height, width: image.width });
    window.URL.revokeObjectURL(objectURL);
  });

  image.src = objectURL;

  return sizePromise;
}
