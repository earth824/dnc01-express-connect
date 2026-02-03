import multer from 'multer';

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, 'public/images');
  },
  filename(req, file, callback) {
    const filename = '' + Date.now() + Math.floor(Math.random() * 100000);
    callback(null, filename + '.' + file.mimetype.split('/')[1]);
  }
});

export const upload = multer({ storage });
