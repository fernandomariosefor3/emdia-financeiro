interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-[3px]",
};

export function LoadingSpinner({ fullScreen = true, size = "lg", label }: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size]} border-[#1AC87E] border-t-transparent rounded-full animate-spin`}
      />
      {label && <p className="text-sm text-gray-400">{label}</p>}
    </div>
  );

  if (!fullScreen) return spinner;

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
      {spinner}
    </div>
  );
}
