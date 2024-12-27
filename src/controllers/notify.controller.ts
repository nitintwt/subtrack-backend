import { prisma } from "../db"

const notifyUsers = async () => {

};
/*
CREATE OR REPLACE FUNCTION notify_backend()
RETURNS void AS $$
DECLARE
  subscription RECORD;
BEGIN
  FOR subscription IN
    SELECT "id"
    FROM "Subscription"
    WHERE "isNotification" = true
      AND (
        CASE
          WHEN "frequency" = 'monthly' THEN
            TO_DATE("lastRenewalDate", 'MM/DD/YYYY') 
            + INTERVAL '1 month' * FLOOR(EXTRACT(MONTH FROM AGE(CURRENT_DATE, TO_DATE("lastRenewalDate", 'MM/DD/YYYY'))) + 1)
          WHEN "frequency" = 'yearly' THEN
            TO_DATE("lastRenewalDate", 'MM/DD/YYYY') 
            + INTERVAL '1 year' * FLOOR(EXTRACT(YEAR FROM AGE(CURRENT_DATE, TO_DATE("lastRenewalDate", 'MM/DD/YYYY'))) + 1)
          ELSE NULL
        END
      ) = CURRENT_DATE + INTERVAL '3 days'
  LOOP
    -- Use pg_notify to send subscription ID
    PERFORM pg_notify('send_notification', subscription.id::text);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT notify_backend();

SELECT cron.schedule(
  'daily_subscription_check',  -- Job name
  '0 8 * * *',                 -- Cron schedule: 8 AM daily
  $$ CALL notify_backend(); $$ -- SQL command to execute
);

SELECT * FROM cron.job;

SELECT jobid, schedule, command 
FROM cron.job;

SELECT cron.alter_job(1, schedule => '39 21 * * *');

*/
