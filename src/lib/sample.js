import { PALETTES } from "./theme.js";
import { uid } from "./utils.js";

export function sampleDiagram() {
  const P = PALETTES.light;
  const [blue, purple, green, orange, red, gray] = P;
  const N = (type, x, y, w, h, c, text, extra = {}) => ({
    id: uid(),
    type,
    x,
    y,
    w,
    h,
    fill: c.fill,
    stroke: c.stroke,
    textColor: c.text,
    strokeWidth: 2,
    fontSize: 14,
    text,
    badge: "",
    parentId: null,
    ...extra,
  });
  const frame = N(
    "group",
    40,
    40,
    270,
    210,
    { fill: "rgba(130,130,140,.10)", stroke: "#a1a1aa", text: "" },
    "Signup / Login / Logout",
  );
  const form = N("rounded", 70, 90, 210, 50, blue, "<form>", {
    parentId: frame.id,
  });
  const ufs = N("rounded", 70, 160, 210, 50, blue, "useFormState()", {
    parentId: frame.id,
  });
  const sa = N("rounded", 430, 70, 220, 52, blue, "Server Action");
  const fv = N("rect", 430, 170, 220, 52, gray, "Form Validation");
  const dr = N("rect", 800, 150, 200, 52, gray, "Data Request");
  const au = N("rect", 800, 260, 210, 52, red, "Authentication", {
    badge: "1",
  });
  const sm = N(
    "group",
    760,
    360,
    300,
    120,
    { fill: "rgba(234,88,12,.08)", stroke: "#ea580c", text: "#9a3412" },
    "Session Management",
    { badge: "2" },
  );
  const st = N("pill", 790, 412, 110, 46, orange, "Stateless", {
    parentId: sm.id,
  });
  const db = N("pill", 920, 412, 110, 46, orange, "Database", {
    parentId: sm.id,
  });
  const mw = N("rounded", 430, 300, 210, 52, purple, "Middleware");
  const ck = N("rounded", 800, 530, 150, 48, purple, "cookies()");
  const az = N(
    "group",
    640,
    640,
    300,
    150,
    { fill: "rgba(22,163,74,.08)", stroke: "#16a34a", text: "#14532d" },
    "Authorization",
    { badge: "3" },
  );
  const dal = N("rounded", 670, 690, 240, 44, green, "Data Access Layer", {
    parentId: az.id,
  });
  const dto = N("rounded", 670, 744, 240, 44, green, "Data Transfer Object", {
    parentId: az.id,
  });
  const nodes = [
    frame,
    form,
    ufs,
    sa,
    fv,
    dr,
    au,
    sm,
    st,
    db,
    mw,
    ck,
    az,
    dal,
    dto,
  ];
  const E = (a, ap, b, bp) => ({
    id: uid("e"),
    from: a.id,
    fromPort: ap,
    to: b.id,
    toPort: bp,
    stroke: "#a1a1aa",
    strokeWidth: 2,
    dashed: false,
    arrow: true,
    label: "",
  });
  const edges = [
    E(form, "right", sa, "left"),
    E(sa, "bottom", fv, "top"),
    E(fv, "right", dr, "left"),
    E(dr, "bottom", au, "top"),
    E(au, "bottom", sm, "top"),
    E(sm, "bottom", ck, "top"),
    E(mw, "right", ck, "left"),
    E(fv, "left", ufs, "left"),
    E(ck, "bottom", az, "top"),
    E(mw, "bottom", az, "top"),
  ];
  return { nodes, edges };
}
