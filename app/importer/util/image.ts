import { Artwork } from 'app/importer/types';

/**
 * Cache objectURL -> BLOB mappings
 */
const objectUrlBlobs = {};

/**
 * Generate a simple object representation of an image Blob.
 */
export function buildImageObject(imageBlob: Blob) {
  const objectURL = window.URL.createObjectURL(imageBlob);
  const image = new Image();

  objectUrlBlobs[objectURL] = imageBlob;

  const promise = new Promise<Artwork>(
    resolve =>
      (image.onload = _ =>
        resolve({
          url: objectURL,
          size: imageBlob.size,
          type: imageBlob.type,
          dimensions: { height: image.height, width: image.width },
        }))
  );

  image.src = objectURL;

  return promise;
}

/**
 * Lookup the BLOB for the given image object.
 */
export function blobForImage(image: Artwork) {
  return objectUrlBlobs[image.url];
}
