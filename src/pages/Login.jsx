import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle, logout } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { FcGoogle } from "react-icons/fc"; // Google icon
import loginBackdrop from "../assets/loginbackdrop.png";
import AuthProgress from "../components/common/AuthProgress";

const ccaPngIcons = Object.values(
  import.meta.glob("../assets/ccaicons/*.png", {
    eager: true,
    import: "default",
  }),
);

export default function Login() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const iconRefs = useRef([]);
  const iconStatesRef = useRef([]);
  const viewportRef = useRef({ width: 0, height: 0 });

  const pseudoRandom = (seed, salt) => {
    const value = Math.sin(seed * 97.13 + salt * 31.7) * 43758.5453;
    return value - Math.floor(value);
  };

  const backdropIcons = useMemo(
    () =>
      ccaPngIcons.map((src, index) => {
        const seed = index + 1;
        return {
          id: `${index}-${src}`,
          src,
          size: 46 + pseudoRandom(seed, 3) * 40,
          seed,
        };
      }),
    [],
  );

  useEffect(() => {
    if (backdropIcons.length === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const updateViewport = () => {
      viewportRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    };

    const applyIconTransforms = () => {
      iconStatesRef.current.forEach((state, index) => {
        const iconEl = iconRefs.current[index];
        if (!iconEl) return;
        iconEl.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${state.rotation}deg)`;
      });
    };

    updateViewport();

    iconStatesRef.current = backdropIcons.map((icon) => {
      const { width, height } = viewportRef.current;
      const maxX = Math.max(width - icon.size, 0);
      const maxY = Math.max(height - icon.size, 0);
      const initialX = pseudoRandom(icon.seed, 1) * maxX;
      const initialY = pseudoRandom(icon.seed, 2) * maxY;
      const speed = 1 + pseudoRandom(icon.seed, 4) * 1.5;
      const angle = pseudoRandom(icon.seed, 5) * Math.PI * 2;

      return {
        x: initialX,
        y: initialY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: pseudoRandom(icon.seed, 6) * 24 - 12,
        spin: pseudoRandom(icon.seed, 7) * 0.4 - 0.2,
        size: icon.size,
      };
    });

    applyIconTransforms();

    if (prefersReducedMotion) {
      const handleResizeStatic = () => {
        updateViewport();
        iconStatesRef.current.forEach((state) => {
          const maxX = Math.max(viewportRef.current.width - state.size, 0);
          const maxY = Math.max(viewportRef.current.height - state.size, 0);
          state.x = Math.min(Math.max(state.x, 0), maxX);
          state.y = Math.min(Math.max(state.y, 0), maxY);
        });
        applyIconTransforms();
      };

      window.addEventListener("resize", handleResizeStatic);
      return () => {
        window.removeEventListener("resize", handleResizeStatic);
      };
    }

    let rafId;
    let lastTime = performance.now();

    const handleResize = () => {
      updateViewport();
      iconStatesRef.current.forEach((state) => {
        const maxX = Math.max(viewportRef.current.width - state.size, 0);
        const maxY = Math.max(viewportRef.current.height - state.size, 0);
        state.x = Math.min(Math.max(state.x, 0), maxX);
        state.y = Math.min(Math.max(state.y, 0), maxY);
      });
    };

    const animate = (time) => {
      const delta = Math.min((time - lastTime) / 16.67, 2);
      lastTime = time;

      const { width, height } = viewportRef.current;

      iconStatesRef.current.forEach((state) => {
        const maxX = Math.max(width - state.size, 0);
        const maxY = Math.max(height - state.size, 0);

        state.x += state.vx * delta;
        state.y += state.vy * delta;
        state.rotation += state.spin * delta;

        if (state.x <= 0) {
          state.x = 0;
          state.vx = Math.abs(state.vx);
        } else if (state.x >= maxX) {
          state.x = maxX;
          state.vx = -Math.abs(state.vx);
        }

        if (state.y <= 0) {
          state.y = 0;
          state.vy = Math.abs(state.vy);
        } else if (state.y >= maxY) {
          state.y = maxY;
          state.vy = -Math.abs(state.vy);
        }
      });

      applyIconTransforms();
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", handleResize);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
    };
  }, [backdropIcons]);

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") navigate("/admin");
      else if (role === "teacher") navigate("/teacher");
      else if (role === "vendor") navigate("/vendor");
      else navigate("/student");
    }
  }, [user, role, loading, navigate]);

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      const email = result.user.email;

      if (!email.endsWith("@sis-kg.org")) {
        alert("Please login using your school email (@sis-kg.org)");
        await logout();
        return;
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Google login failed. Please try again.");
    }
  };

  if (loading) {
    return <AuthProgress fullscreen />;
  }

  return (
    <div
      className="relative min-h-dvh w-full flex items-center justify-center bg-center bg-cover px-4 sm:px-6 lg:px-8 py-6"
      style={{ backgroundImage: `url(${loginBackdrop})` }}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"></div>

      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        {backdropIcons.map((icon, index) => (
          <img
            key={icon.id}
            src={icon.src}
            alt="CCA icon"
            className="login-backdrop-icon absolute select-none"
            style={{
              width: `clamp(28px, ${icon.size * 0.08}vw, ${icon.size}px)`,
              height: `clamp(28px, ${icon.size * 0.08}vw, ${icon.size}px)`,
              left: 0,
              top: 0,
              "--icon-glow-duration": `${3.2 + pseudoRandom(icon.seed, 14) * 2.8}s`,
              "--icon-glow-delay": `-${pseudoRandom(icon.seed, 15) * 3.5}s`,
            }}
            ref={(el) => {
              iconRefs.current[index] = el;
            }}
          />
        ))}
      </div>

      <div className="login-card-float login-card-glow relative z-10 w-full max-w-[620px] flex flex-col items-center justify-center gap-5 sm:gap-6 bg-white/95 px-5 py-7 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-white/50 transform transition-transform hover:scale-[1.02]">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center leading-tight">
          SIS KGNEJ CCA Registration Portal
        </h1>

        {!user && (
          <button
            onClick={handleLogin}
            className="group w-full sm:w-auto flex items-center justify-center gap-3 px-5 sm:px-7 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <FcGoogle size={18} />
            </span>
            <span className="text-slate-800 font-semibold tracking-tight text-sm sm:text-base text-center">
              Login with SIS KGNEJ Google Account
            </span>
          </button>
        )}

        {user && (
          <p className="text-green-700 text-center">
            Logged in as {user.email}
          </p>
        )}
      </div>
    </div>
  );
}
