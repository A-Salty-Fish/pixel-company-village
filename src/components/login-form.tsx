import { ClearHintOnGate } from "@/features/today-can-do/clear-hint-on-gate";

const DISCLAIMER = "代理信号≠绩效；摸鱼分是趣味雷达";

const ERRORS: Record<string, string> = {
  password: "密码不对，再试一次。",
  config: "村口暂时进不去，稍后再来。",
  invalid: "村口暂时进不去，稍后再来。",
};

type Props = {
  errorCode?: string;
};

export function LoginForm({ errorCode }: Props) {
  const error = errorCode ? ERRORS[errorCode] ?? ERRORS.invalid : null;

  return (
    <div className="farm-page flex flex-1 items-center justify-center px-4 py-10">
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{sessionStorage.removeItem('village:today-hint-start-v1');sessionStorage.removeItem('village:today-hint-dismiss-v1');}catch(e){}",
        }}
      />
      <ClearHintOnGate />
      <div className="hud-panel w-full max-w-md overflow-hidden">
        <div className="hud-title">门禁</div>
        <div className="space-y-3 px-4 py-4">
          <p className="text-[11px] tracking-[0.22em] text-[#8a5528]">COZY COMPANY FARM</p>
          <h1 className="text-2xl font-bold text-[#2a1a10]">像素公司村</h1>
          <p className="text-sm text-[#4a3a28]">
            输入站点密码进村子。这里只展示姓名、日期和数字信号，不保存任何聊天内容。
          </p>
          <form action="/api/login" method="post" className="space-y-4" data-testid="login-form">
            <label className="block space-y-1.5 text-sm text-[#4a3a28]">
              站点密码
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                data-testid="login-password"
                className="min-h-11 w-full border-[3px] border-[#6a3d18] bg-[#fffaf0] px-3 py-2 text-[#2a1a10]"
              />
            </label>
            {error ? (
              <p className="text-sm text-[#8a2020]" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="hud-btn w-full" data-testid="login-submit">
              进门
            </button>
            <p className="disclaimer-banner text-center">{DISCLAIMER}</p>
          </form>
        </div>
      </div>
    </div>
  );
}
