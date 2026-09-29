using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

// GrokBotTray: Grok Bot için yüksek performanslı, hafif sistem tepsisi yardımcısı
// Boyut: ~160 KB. Grok Bot ile Named Pipe üzerinden konuşur.

class GrokBotTray
{
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll", CharSet = CharSet.Auto)] static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    const int SW_RESTORE = 9;
    const int SW_SHOW = 5;

    static NotifyIcon? trayIcon;
    static SynchronizationContext? uiContext;
    static int parentPid = -1;
    static string pipeName = "grokbot_tray_pipe";
    static bool isExiting = false;

    [STAThread]
    static void Main(string[] args)
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        if (args.Length > 0 && int.TryParse(args[0], out int pid))
            parentPid = pid;

        if (args.Length > 1 && !string.IsNullOrWhiteSpace(args[1]))
            pipeName = args[1];

        uiContext = SynchronizationContext.Current ?? new WindowsFormsSynchronizationContext();

        trayIcon = new NotifyIcon();
        trayIcon.Text = "Grok Bot";

        // İkonu yükle
        LoadTrayIcon();

        // Sağ tık menüsü
        var menu = new ContextMenuStrip();
        var itemShow = new ToolStripMenuItem("Grok Bot'u Göster", null, (s, e) => SendCommand("SHOW"));
        itemShow.Font = new Font(itemShow.Font, FontStyle.Bold);
        menu.Items.Add(itemShow);
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(new ToolStripMenuItem("Çıkış", null, (s, e) => {
            SendCommand("QUIT");
            ExitApp();
        }));
        trayIcon.ContextMenuStrip = menu;

        // Tıklama olayları
        trayIcon.MouseClick += (s, e) => {
            if (e.Button == MouseButtons.Left)
                SendCommand("SHOW");
        };
        trayIcon.MouseDoubleClick += (s, e) => SendCommand("SHOW");

        trayIcon.Visible = true;

        // Parent process izleyici
        if (parentPid > 0)
        {
            Task.Run(() => {
                try {
                    var proc = Process.GetProcessById(parentPid);
                    proc.WaitForExit();
                } catch { }
                ExitApp();
            });
        }

        // Balon bildirimi pipe dinleyicisi (ilk küçültmede bildirim göstermek için)
        Task.Run(ListenBalloonNotification);

        Application.Run();
    }

    static void LoadTrayIcon()
    {
        try
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string pngPath = Path.Combine(appDir, "tray-icon.png");
            string icoPath = Path.Combine(appDir, "tray-icon.ico");

            if (File.Exists(icoPath))
            {
                try {
                    trayIcon!.Icon = new Icon(icoPath, 32, 32);
                    return;
                } catch { }
            }

            if (File.Exists(pngPath))
            {
                using var bmp = new Bitmap(pngPath);
                using var bmp32 = new Bitmap(bmp, 32, 32);
                trayIcon!.Icon = Icon.FromHandle(bmp32.GetHicon());
                return;
            }

            trayIcon!.Icon = SystemIcons.Application;
        }
        catch
        {
            trayIcon!.Icon = SystemIcons.Application;
        }
    }

    static void SendCommand(string cmd)
    {
        Task.Run(() => {
            try
            {
                using var client = new NamedPipeClientStream(".", pipeName, PipeDirection.Out);
                client.Connect(800);
                using var writer = new StreamWriter(client, Encoding.UTF8);
                writer.WriteLine(cmd);
                writer.Flush();
            }
            catch
            {
                // Named pipe yanıt vermezse Win32 fallback
                if (cmd == "SHOW")
                    ShowWindowFallback();
            }
        });
    }

    static void ShowWindowFallback()
    {
        try
        {
            var processes = Process.GetProcessesByName("Grok Bot");
            foreach (var p in processes)
            {
                EnumWindows((hWnd, lParam) => {
                    GetWindowThreadProcessId(hWnd, out uint pid);
                    if (pid == p.Id)
                    {
                        var sb = new StringBuilder(256);
                        GetWindowText(hWnd, sb, sb.Capacity);
                        string title = sb.ToString();
                        if (title.Contains("Grok") || title.Length > 0)
                        {
                            ShowWindow(hWnd, SW_RESTORE);
                            ShowWindow(hWnd, SW_SHOW);
                            SetForegroundWindow(hWnd);
                        }
                    }
                    return true;
                }, IntPtr.Zero);
            }
        }
        catch { }
    }

    static void ListenBalloonNotification()
    {
        try
        {
            string balloonPipe = pipeName + "_balloon";
            while (!isExiting)
            {
                using var server = new NamedPipeServerStream(balloonPipe, PipeDirection.In);
                server.WaitForConnection();
                uiContext?.Post(_ => {
                    try {
                        trayIcon?.ShowBalloonTip(3000, "Grok Bot",
                            "Grok Bot arka planda çalışmaya devam ediyor. Açmak için simgeye tıklayın.",
                            ToolTipIcon.Info);
                    } catch { }
                }, null);
            }
        }
        catch { }
    }

    static void ExitApp()
    {
        if (isExiting) return;
        isExiting = true;

        uiContext?.Post(_ => {
            try {
                if (trayIcon != null) {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
            } catch { }
            Application.Exit();
        }, null);
    }
}
