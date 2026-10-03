use std::{
    fs,
    path::{Path, PathBuf},
};

/// A private per-job staging directory. Every return path releases partial media.
pub struct StagingDirectory {
    path: PathBuf,
}

impl StagingDirectory {
    pub fn new(kind: &str) -> Result<Self, String> {
        let path =
            crate::platform::temp_download_dir().join(format!("{kind}-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&path).map_err(|error| error.to_string())?;
        Ok(Self { path })
    }
    pub fn path(&self) -> &Path {
        &self.path
    }
}

impl Drop for StagingDirectory {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}

/// Claims an output name before probing/spawning, including across concurrent jobs.
pub struct OutputFile {
    path: PathBuf,
    keep: bool,
}
impl OutputFile {
    pub fn reserve(directory: &Path, stem: &str, extension: &str) -> Result<Self, String> {
        for index in 0..100_000 {
            let name = if index == 0 {
                format!("{stem}.{extension}")
            } else {
                format!("{stem} ({index}).{extension}")
            };
            let path = directory.join(name);
            match fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&path)
            {
                Ok(_) => return Ok(Self { path, keep: false }),
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
                Err(error) => return Err(error.to_string()),
            }
        }
        Err("Too many files with this output name".into())
    }
    pub fn path(&self) -> &Path {
        &self.path
    }
    pub fn keep(&mut self) {
        self.keep = true;
    }
}
impl Drop for OutputFile {
    fn drop(&mut self) {
        if !self.keep {
            let _ = fs::remove_file(&self.path);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parallel_reservations_and_cancellation_preserve_existing_results() {
        let directory =
            std::env::temp_dir().join(format!("gorex-output-test-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&directory).unwrap();
        fs::write(directory.join("video.mp4"), b"existing video").unwrap();
        let mut first = OutputFile::reserve(&directory, "video", "mp4").unwrap();
        let second = OutputFile::reserve(&directory, "video", "mp4").unwrap();
        assert_ne!(first.path(), second.path());
        assert_ne!(first.path(), directory.join("video.mp4"));
        let first_path = first.path().to_path_buf();
        let second_path = second.path().to_path_buf();
        fs::write(&first_path, b"finished video").unwrap();
        first.keep();
        drop(first);
        drop(second);
        assert_eq!(fs::read(&first_path).unwrap(), b"finished video");
        assert!(!second_path.exists());
        assert_eq!(
            fs::read(directory.join("video.mp4")).unwrap(),
            b"existing video"
        );
        fs::remove_dir_all(directory).unwrap();
    }
}
