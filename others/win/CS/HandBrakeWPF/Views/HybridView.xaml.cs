using System;
using System.Windows.Controls;
using Microsoft.Web.WebView2.Core;
using HandBrakeWPF.Bridge;
using HandBrakeWPF.ViewModels;
using System.IO;

namespace HandBrakeWPF.Views
{
    public partial class HybridView : UserControl
    {
        private BpressBridge _bridge;

        public HybridView()
        {
            InitializeComponent();
            InitializeWebView();
        }

        private async void InitializeWebView()
        {
            try
            {
                webView.DefaultBackgroundColor = System.Drawing.Color.Transparent;
                await webView.EnsureCoreWebView2Async();
                
                // Get the ViewModel from DataContext (wait if not ready)
                if (this.DataContext is MainViewModel viewModel)
                {
                    SetupBridge(viewModel);
                    SyncTheme(viewModel.IsDarkMode);
                }
                else
                {
                    this.DataContextChanged += (s, e) => {
                        if (e.NewValue is MainViewModel vm) {
                            SetupBridge(vm);
                            SyncTheme(vm.IsDarkMode);
                        }
                    };
                }

                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                MainViewModel vm = this.DataContext as MainViewModel;

                // Intercept Drop Navigation to load the files via HandBrake Core
                string uiBaseDir = Path.GetFullPath(Path.Combine(baseDir, "bpress_ui")).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                Uri uiBaseUri = new Uri(uiBaseDir + "/");

                webView.CoreWebView2.NavigationStarting += (s, e) =>
                {
                    string uriStr = e.Uri;
                    System.Diagnostics.Debug.WriteLine($"[BPRESS] Navigation attempt to: {uriStr}");

                    try 
                    {
                        Uri targetUri = new Uri(uriStr);
                        
                        // Check if it's a local file and NOT within our UI folder
                        if (targetUri.IsFile && !uiBaseUri.IsBaseOf(targetUri))
                        {
                            e.Cancel = true; // Block WebView from replacing the app UI immediately
                            
                            string droppedFilePath = targetUri.LocalPath;
                            System.Diagnostics.Debug.WriteLine($"[BPRESS] Intercepted external drop: {droppedFilePath}");

                            // Send the file to HandBrake's Queue/Scanner
                            if (this.DataContext is MainViewModel mainVm)
                            {
                                System.Windows.Application.Current.Dispatcher.Invoke(() =>
                                {
                                    mainVm.StartScan(new System.Collections.Generic.List<string> { droppedFilePath }, 0);
                                });
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[BPRESS] Error in NavigationStarting: {ex.Message}");
                    }
                };

                // Load initial page AFTER setting up event handlers
                string page = (vm != null && !vm.ShowSourceSelection) ? "video_list.html" : "index.html";
                string htmlPath = System.IO.Path.GetFullPath(System.IO.Path.Combine(baseDir, "bpress_ui", page));

                if (System.IO.File.Exists(htmlPath))
                {
                    webView.CoreWebView2.Navigate(new Uri(htmlPath).AbsoluteUri);
                }
                else
                {
                    webView.CoreWebView2.NavigateToString($"<html style='background: #121118; color: #fff; text-align: center; padding: 2rem;'><body class='dark-theme'><h1>BPRESS UI Error</h1><p>File not found: {htmlPath}</p></body></html>");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"WebView2 Error: {ex.Message}");
            }
        }

        private void SetupBridge(MainViewModel viewModel)
        {
            _bridge = new BpressBridge(viewModel);
            webView.CoreWebView2.AddHostObjectToScript("bridge", _bridge);

            // Listen for theme and state changes in the ViewModel
            viewModel.PropertyChanged += (s, e) =>
            {
                if (e.PropertyName == nameof(MainViewModel.IsDarkMode))
                {
                    SyncTheme(viewModel.IsDarkMode);
                }
                else if (e.PropertyName == nameof(MainViewModel.ShowSourceSelection))
                {
                    if (webView.CoreWebView2 != null)
                    {
                        System.Windows.Application.Current.Dispatcher.Invoke(() =>
                        {
                            try 
                            {
                                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                                string page = viewModel.ShowSourceSelection ? "index.html" : "video_list.html";
                                string path = System.IO.Path.GetFullPath(System.IO.Path.Combine(baseDir, "bpress_ui", page));
                                
                                System.Diagnostics.Debug.WriteLine($"[BPRESS] ShowSourceSelection={viewModel.ShowSourceSelection}, Navigating to {page}");
                                
                                if (System.IO.File.Exists(path))
                                {
                                    webView.CoreWebView2.Navigate(new Uri(path).AbsoluteUri);
                                }
                                else 
                                {
                                    System.Diagnostics.Debug.WriteLine($"[BPRESS] PAGE MISSING: {path}");
                                    webView.CoreWebView2.NavigateToString($"<html style='background: #121118; color: #fff;'><body class='dark-theme'><h1>Error: {path} not found!</h1></body></html>");
                                }
                            }
                            catch (Exception ex)
                            {
                                System.Diagnostics.Debug.WriteLine($"Nav error: {ex.Message}");
                            }
                        });
                    }
                }
            };
        }

        private void SyncTheme(bool isDark)
        {
            if (webView.CoreWebView2 != null)
            {
                string js = $"if (window.setTheme) window.setTheme({isDark.ToString().ToLower()});";
                webView.CoreWebView2.ExecuteScriptAsync(js);
            }
        }
    }
}
