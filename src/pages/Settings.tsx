import { useStorageMode } from '@/shared/hooks/useStorageMode';

export function Settings() {
  const { mode, loading, isFileSupported, switchToFile } = useStorageMode();

  const handleSwitchToFile = async () => {
    const success = await switchToFile();
    if (success) {
      alert('已切换到文件存储！文件已保存到您选择的位置。');
    }
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="settings-page">
      <h1>设置</h1>

      <section className="settings-section">
        <h2>数据存储</h2>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>存储方式</label>
            <p className="setting-desc">
              {mode?.type === 'file' 
                ? `当前使用: ${mode.fileName || '文件存储'}`
                : '当前使用: 浏览器本地存储'
              }
            </p>
          </div>
          
          {mode?.type === 'localStorage' && isFileSupported && (
            <button 
              className="btn btn-primary"
              onClick={handleSwitchToFile}
            >
              切换到 iCloud 文件
            </button>
          )}
          
          {mode?.type === 'file' && (
            <span className="badge badge-completed">已启用文件存储</span>
          )}
        </div>

        {!isFileSupported && (
          <div className="setting-item">
            <div className="setting-info">
              <label>跨设备同步</label>
              <p className="setting-desc">
                您的浏览器不支持文件存储 API。请使用 Chrome/Edge 浏览器以支持 iCloud 同步功能。
              </p>
            </div>
          </div>
        )}

        {mode?.type === 'file' && (
          <div className="setting-tip">
            <strong>💡 提示：</strong>
            数据文件存储在您选择的位置（如 iCloud Drive）。在另一台设备上打开相同文件即可同步数据。
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>关于</h2>
        <div className="setting-item">
          <div className="setting-info">
            <label>OThings</label>
            <p className="setting-desc">版本 1.0.0</p>
          </div>
        </div>
      </section>
    </div>
  );
}
