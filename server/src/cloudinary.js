const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBufferToCloudinary(buffer, folder = 'sportstalk') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

function deleteFromCloudinary(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

function publicIdFromUrl(url) {
  // Cloudinary URL pattern:
  // https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<id>.<ext>
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return null;
    // Skip version segment if present (vXXXXXXX)
    const rest = parts.slice(uploadIdx + 1).filter((p) => !/^v\d+$/.test(p));
    const joined = rest.join('/');
    return joined.replace(/\.[^.]+$/, '');
  } catch {
    return null;
  }
}

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  publicIdFromUrl,
};
