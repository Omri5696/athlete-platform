import { CheckinForm } from "./CheckinForm";

export default function CheckinPage() {
  return (
    <main>
      <CheckinForm />
      <p className="foot-note">
        בגרסה החיה כל מתאמן יקבל כל בוקר קישור אישי לטופס הזה במייל, והתשובות
        יישמרו וייכנסו לדשבורד של המאמן.
      </p>
    </main>
  );
}
