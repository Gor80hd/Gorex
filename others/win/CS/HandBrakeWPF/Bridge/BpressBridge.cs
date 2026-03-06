using System;
using System.Runtime.InteropServices;
using System.Windows;
using HandBrakeWPF.ViewModels;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.IO;

namespace HandBrakeWPF.Bridge
{
    [ComVisible(true)]
    public class BpressBridge
    {
        private readonly MainViewModel _viewModel;

        public BpressBridge(MainViewModel viewModel)
        {
            _viewModel = viewModel;
        }

        public void OpenSource()
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                // Trigger the Open Source command
                _viewModel.FileScan();
            });
        }

        public void OpenSettings()
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                _viewModel.OpenOptionsWindow();
            });
        }

        public void OpenAbout()
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                _viewModel.OpenAboutApplication();
            });
        }

        public void ToggleTheme()
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                _viewModel.ToggleTheme();
            });
        }

        public void OpenVideoSettings(string videoId)
        {
            // Stub for opening specific file settings
            Application.Current.Dispatcher.Invoke(() =>
            {
                MessageBox.Show($"Open settings for video ID: {videoId}", "BPRESS Web Interop");
            });
        }

        public void ProcessNext()
        {
            // Stub for Next action
            Application.Current.Dispatcher.Invoke(() =>
            {
                MessageBox.Show("Proceeding to next step...", "BPRESS Web Interop");
            });
        }

        public string GetVideoData()
        {
            if (_viewModel.ScannedSource == null || _viewModel.ScannedSource.Titles.Count == 0)
                return "[]";

            var videoList = new List<object>();

            foreach (var title in _viewModel.ScannedSource.Titles)
            {
                var audio = title.AudioTracks.FirstOrDefault();
                
                // Format metadata string
                string meta = $"{(int)title.Duration.TotalHours:00}:{title.Duration.Minutes:00}:{title.Duration.Seconds:00} " +
                             $"{title.Resolution.Width}x{title.Resolution.Height} " +
                             $"{title.Fps:0.##} FPS " +
                             $"{(audio != null ? audio.Description : "")}";

                videoList.Add(new
                {
                    id = title.TitleNumber.ToString(),
                    title = title.DisplaySourceName ?? "Unknown Video",
                    meta = meta,
                    size = "---", // HandBrake doesn't easily provide final size before encode
                    thumbnail = "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=400&h=200&fit=crop" // Placeholder for now
                });
            }

            return JsonSerializer.Serialize(videoList);
        }
    }
}
