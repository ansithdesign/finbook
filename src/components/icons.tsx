// Phosphor icon set, exposed under the names the screens already use.
// One family, one stroke language: regular by default, bold for emphasis, fill for selected states,
// duotone where an icon sits in a tinted badge.

import type { ComponentType, CSSProperties } from 'react';
import {
  ArrowCounterClockwise,
  ArrowDown as PArrowDown,
  ArrowUp as PArrowUp,
  ArrowUpRight as PArrowUpRight,
  ArrowsLeftRight,
  Bank,
  BatteryFull as PBatteryFull,
  Bell as PBell,
  BookmarkSimple,
  Buildings,
  CalendarDots,
  CaretLeft,
  CaretRight,
  CellSignalFull,
  ChartLineUp,
  ChatText,
  Check as PCheck,
  CheckCircle,
  Circle as PCircle,
  ClipboardText,
  ClockCounterClockwise,
  Compass as PCompass,
  EnvelopeSimple,
  Eye as PEye,
  EyeSlash,
  GearSix,
  House,
  Info as PInfo,
  Key,
  Lightbulb as PLightbulb,
  LinkSimple,
  Lock as PLock,
  MagnifyingGlass,
  Money,
  PiggyBank as PPiggyBank,
  Plugs,
  Plus as PPlus,
  Question,
  Receipt as PReceipt,
  ShieldCheck as PShieldCheck,
  SidebarSimple,
  SignOut,
  SlidersHorizontal as PSlidersHorizontal,
  Target as PTarget,
  Trash,
  Tray,
  User as PUser,
  Wallet as PWallet,
  Warning,
  WifiHigh,
  WifiSlash,
  X as PX,
  type IconProps as PhosphorProps,
  type IconWeight,
} from '@phosphor-icons/react';

export interface IconProps {
  size?: number | string;
  /** Kept for call sites written for a stroke-width icon set: heavier strokes map to Phosphor's bold weight. */
  strokeWidth?: number | string;
  weight?: IconWeight;
  color?: string;
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export type LucideIcon = ComponentType<IconProps>;

function icon(C: ComponentType<PhosphorProps>, fixed?: IconWeight): LucideIcon {
  function I({ strokeWidth, weight, ...rest }: IconProps) {
    const w = weight ?? fixed ?? (Number(strokeWidth) >= 2.4 ? 'bold' : 'regular');
    return <C weight={w} aria-hidden {...rest} />;
  }
  return I;
}

export const AlertTriangle = icon(Warning);
export const ArrowUp = icon(PArrowUp, 'bold');
export const ArrowDown = icon(PArrowDown, 'bold');
export const ArrowUpRight = icon(PArrowUpRight);
export const Banknote = icon(Money);
export const BatteryFull = icon(PBatteryFull, 'fill');
export const Bell = icon(PBell);
export const Bookmark = icon(BookmarkSimple);
export const BookmarkCheck = icon(BookmarkSimple, 'fill');
export const Building2 = icon(Buildings);
export const CalendarClock = icon(CalendarDots);
export const Check = icon(PCheck, 'bold');
export const CheckCircle2 = icon(CheckCircle);
export const ChevronLeft = icon(CaretLeft);
export const ChevronRight = icon(CaretRight);
export const Circle = icon(PCircle);
export const CircleHelp = icon(Question);
export const ClipboardList = icon(ClipboardText);
export const Compass = icon(PCompass);
export const Eye = icon(PEye);
export const EyeOff = icon(EyeSlash);
export const GitCompare = icon(ArrowsLeftRight);
export const History = icon(ClockCounterClockwise);
export const Home = icon(House);
export const Inbox = icon(Tray);
export const Info = icon(PInfo);
export const KeyRound = icon(Key);
export const Landmark = icon(Bank);
export const Lightbulb = icon(PLightbulb);
export const LineChart = icon(ChartLineUp);
export const Link2 = icon(LinkSimple);
export const Lock = icon(PLock);
export const LogOut = icon(SignOut);
export const MailCheck = icon(EnvelopeSimple);
export const MessageSquareText = icon(ChatText);
export const PanelLeftClose = icon(SidebarSimple);
export const PanelLeftOpen = icon(SidebarSimple, 'fill');
export const PiggyBank = icon(PPiggyBank);
export const PlugZap = icon(Plugs);
export const Plus = icon(PPlus);
export const Receipt = icon(PReceipt);
export const RotateCcw = icon(ArrowCounterClockwise);
export const Search = icon(MagnifyingGlass);
export const Settings = icon(GearSix);
export const ShieldCheck = icon(PShieldCheck);
export const Signal = icon(CellSignalFull, 'fill');
export const SlidersHorizontal = icon(PSlidersHorizontal);
export const Target = icon(PTarget);
export const Trash2 = icon(Trash);
export const User = icon(PUser);
export const Wallet = icon(PWallet);
export const Wifi = icon(WifiHigh, 'bold');
export const WifiOff = icon(WifiSlash);
export const X = icon(PX);
