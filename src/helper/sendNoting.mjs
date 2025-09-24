// Функция-заглушка для отправки уведомлений через ботов (Telegram, Viber и т.д.)
// Реализация будет добавлена позже
async function sendBotNotification(userId, message, messageType = 'reminder') {
  try {
    // TODO: Здесь будет логика отправки через Telegram/Viber ботов
    console.log(`[BOT_NOTIFICATION] Sending message to user ${userId}:`, message);
    
    // Пример структуры для будущей реализации:
    /*
    switch(messageType) {
      case 'payment_reminder':
        // Отправка напоминания о платеже
        break;
      case 'payment_overdue':
        // Отправка уведомления о просроченном платеже
        break;
      case 'transaction_update':
        // Отправка обновления по транзакции
        break;
      default:
        // Стандартное уведомление
    }
    */
    
    // Возвращаем успешный результат для совместимости
    return { success: true, messageId: `bot_${Date.now()}` };
  } catch (error) {
    console.error('[BOT_NOTIFICATION] Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

// Функция отправки email через Infobip HTTP API
async function sendEmailNotification(toEmail, subject, htmlContent, category = 'business') {
  try {
    // Проверка конфигурации
    const infobipConfig = {
      baseUrl: process.env.INFOBIP_API_URL || 'https://api.infobip.com',
      apiKey: process.env.INFOBIP_API_KEY,
      fromEmail: process.env.INFOBIP_FROM_EMAIL || 'noreply@doctor-height.online',
    };

    if (!infobipConfig.apiKey) {
      throw new Error('INFOBIP_API_KEY is not configured in environment variables');
    }

    // Подготовка данных для отправки
    const emailData = {
      from: infobipConfig.fromEmail,
      to: toEmail,
      subject: subject,
      html: htmlContent,
      // Добавляем категорию для отслеживания бизнес-писем
      headers: {
        'X-Category': category
      }
    };

    // Отправка через Infobip API (заглушка)
    console.log('[EMAIL_NOTIFICATION] Sending email via Infobip:', {
      to: toEmail,
      subject: subject,
      category: category
    });

    // TODO: Реальная реализация через HTTP-запрос к Infobip API
    /*
    const response = await fetch(`${infobipConfig.baseUrl}/email/3/send`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${infobipConfig.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();
    return result;
    */

    // Возвращаем имитацию успешной отправки
    return {
      success: true,
      messageId: `email_${Date.now()}`,
      to: toEmail,
      subject: subject
    };

  } catch (error) {
    console.error('[EMAIL_NOTIFICATION] Error sending email:', error);
    throw error;
  }
}

// Функция проверки и отправки уведомлений о предстоящих платежах
async function checkAndSendPaymentNotifications() {
  try {
    console.log('[NOTIFICATION_SERVICE] Starting payment notification check');

    // Получаем транзакции с предстоящими платежами
    const query = `
      SELECT 
        t.id as transaction_id,
        t.full_payment_deadline,
        t.payment_type,
        t.schedule_payment_day,
        t.total_amount,
        u1.email as buyer_email,
        u1.phone as buyer_phone,
        u1.name as buyer_name,
        u2.email as seller_email,
        u2.phone as seller_phone,
        u2.name as seller_name
      FROM transactions t
      JOIN users u1 ON t.new_owner_id = u1.id
      JOIN users u2 ON t.previous_owner_id = u2.id
      WHERE t.status = 'approved' 
        AND t.payment_status != 'completed'
        AND (
          -- Для полной оплаты: проверяем за 7 и 1 день до дедлайна
          (t.payment_type = 'full' AND t.full_payment_deadline IS NOT NULL 
           AND (DATE_SUB(t.full_payment_deadline, INTERVAL 7 DAY) = CURDATE()
                OR DATE_SUB(t.full_payment_deadline, INTERVAL 1 DAY) = CURDATE()))
          OR
          -- Для оплаты по расписанию: проверяем за 1 день до установленного дня месяца
          (t.payment_type = 'schedule' AND t.schedule_payment_day IS NOT NULL
           AND t.schedule_payment_day = DAY(DATE_ADD(CURDATE(), INTERVAL 1 DAY)))
        )
    `;

    const [transactions] = await pool.query(query);

    console.log(`[NOTIFICATION_SERVICE] Found ${transactions.length} transactions for notification`);

    for (const transaction of transactions) {
      try {
        // Определяем тип уведомления и срок
        let notificationType, daysBefore;
        const paymentDate = transaction.payment_type === 'full' 
          ? transaction.full_payment_deadline 
          : new Date(new Date().getFullYear(), new Date().getMonth(), transaction.schedule_payment_day);

        if (transaction.payment_type === 'full') {
          const daysDiff = Math.ceil((new Date(transaction.full_payment_deadline) - new Date()) / (1000 * 60 * 60 * 24));
          notificationType = daysDiff === 7 ? 'reminder_week' : 'reminder_day';
          daysBefore = daysDiff;
        } else {
          notificationType = 'reminder_day';
          daysBefore = 1;
        }

        // Подготовка данных для уведомлений
        const subject = `Payment Reminder - Transaction #${transaction.transaction_id}`;
        const htmlContent = generatePaymentReminderEmail(
          transaction, 
          notificationType, 
          daysBefore
        );

        // Отправка email покупателю
        if (transaction.buyer_email) {
          try {
            await sendEmailNotification(
              transaction.buyer_email,
              subject,
              htmlContent,
              'business'
            );
            console.log(`[NOTIFICATION] Email sent to buyer: ${transaction.buyer_email}`);
          } catch (emailError) {
            console.error(`[NOTIFICATION] Error sending email to buyer ${transaction.buyer_email}:`, emailError);
          }
        }

        // Отправка через ботов покупателю
        if (transaction.buyer_phone) {
          try {
            await sendBotNotification(
              transaction.new_owner_id,
              `Reminder: ${daysBefore} days left until payment for transaction #${transaction.transaction_id}`,
              'payment_reminder'
            );
            console.log(`[NOTIFICATION] Bot notification sent to buyer ID: ${transaction.new_owner_id}`);
          } catch (botError) {
            console.error(`[NOTIFICATION] Error sending bot notification to buyer ID ${transaction.new_owner_id}:`, botError);
          }
        }

        // Для просроченных платежей - уведомление продавцу
        if (notificationType === 'reminder_day' && transaction.payment_type === 'full') {
          const isOverdue = new Date() > new Date(transaction.full_payment_deadline);
          if (isOverdue && transaction.seller_email) {
            const overdueSubject = `Overdue Payment - Transaction #${transaction.transaction_id}`;
            const overdueHtml = generateOverduePaymentEmail(transaction);
            
            try {
              await sendEmailNotification(
                transaction.seller_email,
                overdueSubject,
                overdueHtml,
                'business'
              );
              console.log(`[NOTIFICATION] Overdue email sent to seller: ${transaction.seller_email}`);
            } catch (emailError) {
              console.error(`[NOTIFICATION] Error sending overdue email to seller ${transaction.seller_email}:`, emailError);
            }
          }
        }

      } catch (transactionError) {
        console.error(`[NOTIFICATION] Error processing transaction ${transaction.transaction_id}:`, transactionError);
      }
    }

    console.log('[NOTIFICATION_SERVICE] Notification check completed');

  } catch (error) {
    console.error('[NOTIFICATION_SERVICE] Critical error in notification service:', error);
  }
}

// Генерация HTML для email-напоминания о платеже
function generatePaymentReminderEmail(transaction, notificationType, daysBefore) {
  const isOverdue = daysBefore < 0;
  const paymentDate = transaction.payment_type === 'full' 
    ? new Date(transaction.full_payment_deadline).toLocaleDateString('en-US')
    : `${transaction.schedule_payment_day}th day of each month`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">${isOverdue ? '⚠️ Overdue Payment' : '💳 Payment Reminder'}</h2>
            
            <p>Dear ${transaction.buyer_name},</p>
            
            ${isOverdue 
              ? `<p style="color: #e74c3c; font-weight: bold;">Attention! The payment deadline for transaction #${transaction.transaction_id} has expired.</p>`
              : `<p>This is a reminder that payment is due ${daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`} (${paymentDate}).</p>`
            }
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Transaction Details #${transaction.transaction_id}</h3>
                <p><strong>Amount to pay:</strong> ${transaction.total_amount} PKR</p>
                <p><strong>Payment date:</strong> ${paymentDate}</p>
                <p><strong>Payment type:</strong> ${transaction.payment_type === 'full' ? 'Full payment' : 'Scheduled payment'}</p>
            </div>
            
            <p>Please remember to make the payment by the specified deadline.</p>
            
            <p>Best regards,<br>Doctor Height Team</p>
        </div>
    </body>
    </html>
  `;
}

// Генерация HTML для email о просроченном платеже (продавцу)
function generateOverduePaymentEmail(transaction) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Overdue Payment</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #e74c3c;">⚠️ Overdue Payment</h2>
            
            <p>Dear ${transaction.seller_name},</p>
            
            <p>Payment for transaction #${transaction.transaction_id} is overdue.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Transaction Details</h3>
                <p><strong>Amount:</strong> ${transaction.total_amount} PKR</p>
                <p><strong>Payment deadline:</strong> ${new Date(transaction.full_payment_deadline).toLocaleDateString('en-US')}</p>
                <p><strong>Buyer:</strong> ${transaction.buyer_name} (${transaction.buyer_email})</p>
            </div>
            
            <p>We recommend contacting the buyer to clarify the situation.</p>
            
            <p>Best regards,<br>Doctor Height Team</p>
        </div>
    </body>
    </html>
  `;
}

// Планировщик уведомлений (запускать раз в день)
function schedulePaymentNotifications() {
  // Запуск немедленно при старте
  checkAndSendPaymentNotifications();
  
  // Планирование ежедневного запуска в 09:00
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(9, 0, 0, 0);
  
  // Если текущее время уже прошло 09:00, планируем на завтра
  if (now > nextRun) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  const delay = nextRun - now;
  
  setTimeout(() => {
    // Запуск проверки
    checkAndSendPaymentNotifications();
    
    // Установка интервала на каждый день
    setInterval(checkAndSendPaymentNotifications, 24 * 60 * 60 * 1000);
  }, delay);
  
  console.log(`[SCHEDULER] Notification scheduler set. Next run: ${nextRun}`);
}

// Экспорт функций для использования в основном приложении
export {
  sendBotNotification,
  sendEmailNotification,
  checkAndSendPaymentNotifications,
  schedulePaymentNotifications
};