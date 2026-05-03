export default function ResultsSkeleton() {
  return (
    <div className="skel">
      <div className="skel__sheet">
        <div className="skel__risk">
          <div className="skel__shine" />
          <div className="skel__pills">
            <div className="skel__pill" />
            <div className="skel__pill skel__pill--r" />
          </div>
          <div className="skel__line skel__line--micro" />
          <div className="skel__line skel__line--head" />
          <div className="skel__line skel__line--strip skel__line--narrow" />
          <div className="skel__line skel__line--strip skel__line--narrow" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel__sec" style={{ animationDelay: `${120 + i * 80}ms` }}>
            <div className="skel__shine" />
            <div className="skel__line skel__line--lab" />
            <div className="skel__line skel__line--strip" />
            <div className="skel__line skel__line--strip skel__line--mid" />
          </div>
        ))}
        <div className="skel__crt" style={{ animationDelay: "460ms" }}>
          <div className="skel__shine skel__shine--under" />
          <div className="skel__crt-head" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skel__crt-row">
              <div className="skel__line skel__line--l" />
              <div className="skel__line skel__line--v" />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .skel {
          display: flex;
          flex-direction: column;
        }
        .skel__sheet {
          border: 1px solid #d8ede8;
          background: #ffffff;
          overflow: hidden;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        }
        .skel__risk {
          position: relative;
          min-height: 120px;
          padding: 22px 20px 24px;
          background: #fff5f5;
          border-left: 6px solid #dc2626;
          border-bottom: 1px solid #d8ede8;
          overflow: hidden;
        }
        .skel__pills {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          margin-bottom: 14px;
        }
        .skel__pill {
          height: 28px;
          width: 88px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #d8ede8;
        }
        .skel__pill--r {
          width: 72px;
        }
        .skel__sec {
          position: relative;
          padding: 24px 20px;
          border-bottom: 1px solid #d8ede8;
          overflow: hidden;
          opacity: 0;
          animation: skel-fade-up 0.45s ease forwards;
        }
        .skel__crt {
          position: relative;
          padding: 0 20px 20px;
          overflow: hidden;
          opacity: 0;
          animation: skel-fade-up 0.45s ease forwards;
        }
        @keyframes skel-fade-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .skel__crt-head {
          height: 12px;
          width: 168px;
          margin: 20px 0 16px;
          border-radius: 2px;
          background: transparent;
          border-bottom: 2px solid #0d5c4a;
        }
        .skel__crt-row {
          display: grid;
          gap: 8px;
          padding: 20px 0;
          border-bottom: 1px solid #f0f4f3;
        }
        .skel__crt-row:last-child {
          border-bottom: none;
        }
        .skel__shine,
        .skel__shine--under {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .skel__shine::after,
        .skel__shine--under::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 45%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
          animation: shimmer-sweep 1.35s ease-in-out infinite;
        }
        .skel__shine--under::after {
          animation-delay: 0.2s;
        }
        .skel__line {
          position: relative;
          z-index: 1;
          height: 10px;
          border-radius: 4px;
          background: #eceff1;
          margin-bottom: 10px;
        }
        .skel__line:last-child {
          margin-bottom: 0;
        }
        .skel__line--micro {
          width: 120px;
          height: 8px;
          background: #d8ede8;
          opacity: 0.9;
          margin-bottom: 10px;
        }
        .skel__line--head {
          width: 58%;
          height: 22px;
          margin-bottom: 12px;
          background: #fecaca;
          opacity: 0.5;
        }
        .skel__line--strip {
          width: 100%;
        }
        .skel__line--narrow {
          width: 92%;
        }
        .skel__line--mid {
          width: 88%;
        }
        .skel__line--lab {
          width: 28%;
          height: 8px;
          margin-bottom: 14px;
          background: #e8f5f0;
        }
        .skel__line--l {
          width: 42%;
          height: 10px;
          margin-bottom: 0;
          background: #e5e7eb;
        }
        .skel__line--v {
          width: 100%;
          height: 12px;
          margin-bottom: 0;
          background: #eceff1;
        }
        @keyframes shimmer-sweep {
          0% {
            transform: translateX(-130%);
          }
          100% {
            transform: translateX(320%);
          }
        }
      `}</style>
    </div>
  )
}
