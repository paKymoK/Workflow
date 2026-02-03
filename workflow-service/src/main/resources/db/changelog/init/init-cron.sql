SELECT cron.schedule('cleanup-cron-logs', '0 * * * *', $$ DELETE FROM cron.job_run_details
    WHERE status = 'succeeded'
    AND start_time < now() - interval '1 day'
$$);

SELECT cron.schedule(
               'process-updates',
               '5 seconds',
               'CALL calculate_sla()'
       );