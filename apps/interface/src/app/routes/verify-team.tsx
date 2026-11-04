"use client";

export default function () {
  return (
    <>
      <div className="container mx-auto py-8 flex-1 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-medium mb-4">Verify Nemi Team Contacts</h1>
        <p className="text-muted-foreground mb-4">
          These are the official contact details of the Nemi team. If you are
          contacted by someone claiming to be from the Nemi team but they are
          not on this list, please ignore them.
        </p>
        <div className="flex gap-4 w-full justify-center">
          <div className="md:col-span-1 bg-background border rounded-lg p-5">
            <p>Oleh (Founder)</p>
            <p>Telegram: @foustling</p>
          </div>
          <div className="md:col-span-1 bg-background border rounded-lg p-5">
            <p>Danyil (Founder)</p>
            <p>Telegram: @sound_peace</p>
          </div>
        </div>
      </div>
    </>
  );
}
