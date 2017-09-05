/**
 * Generate a simple object representation of an image Blob.
 */
export function buildImageObject(imageBlob) {
  const objectURL = window.URL.createObjectURL(imageBlob);
  const image = new Image();

  const promise = new Promise(resolve => image.onload = _ => resolve({
    url:        objectURL,
    size:       imageBlob.size,
    type:       imageBlob.type,
    dimensions: { height: image.height, width: image.width },
  }));

  image.src = objectURL;

  return promise;
}
