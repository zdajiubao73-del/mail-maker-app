import { Img, staticFile } from "remotion";

type PhoneMockupProps = {
  screenshotPath: string;
  scrollOffset?: number;
  scale?: number;
};

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  screenshotPath,
  scrollOffset = 0,
  scale = 1,
}) => {
  const outerWidth = 360;
  const outerHeight = 740;
  const borderWidth = 8;
  const innerWidth = outerWidth - borderWidth * 2;
  const innerHeight = outerHeight - borderWidth * 2;

  return (
    <div
      style={{
        width: outerWidth,
        height: outerHeight,
        borderRadius: 48,
        border: `${borderWidth}px solid #1E293B`,
        background: "#000",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        transform: `scale(${scale})`,
      }}
    >
      {/* Screenshot */}
      <div
        style={{
          width: innerWidth,
          height: innerHeight,
          borderRadius: 40,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Img
          src={staticFile(screenshotPath)}
          style={{
            width: innerWidth,
            height: "auto",
            transform: `translateY(${scrollOffset}px)`,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: borderWidth + 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 30,
          borderRadius: 15,
          background: "#000",
          zIndex: 10,
        }}
      />
    </div>
  );
};
