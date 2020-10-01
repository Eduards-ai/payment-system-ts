import express, { Request, Response } from 'express'
import config from 'config'
import paypal from 'paypal-rest-sdk'


paypal.configure({
    'mode': 'sandbox', // sandbox or live
    'client_id': 'AUMwXW1As9dhPn-8tIohqrHfUNsVxUjG-TSnZHtLJzPpOPcP3Mggp7gD4z4ecT5sCmjdb6tC4OcyLnEO',
    'client_secret': 'EH22WEGWJ7ldqjXCiJlNjhEJYMUXCmney9DKkRV_Lw4mlRXl7b2IqxM5IK70OmPMQnviWCWIuifviICY'

}) 

const app = express();

const PORT = config.get('port') || 4000

app.get('/', (req: Request, res: Response) => res.sendFile(__dirname + '/index.html'))

app.listen(PORT, () => console.log(`Server has been started on this ${PORT}...`))

app.post('/pay', (req: Request, res: Response) => {
    const create_payment_json = {
        'intent': 'sale',
        'payer': {
            'payment_method': 'paypal'
        },
        'redirect_urls': {
            'return_url': 'http://localhost:4000/success',
            'cancel_url': 'http://localhost:4000/cancel'
        },
        'transactions': [{
            'item_list': {
                'items': [{
                    'name': 'M4A1-S',
                    'sku': '001',
                    'price': '25.00',
                    'currency': 'USD',
                    'quantity': 1
                }]
            },
            'amount': {
                'currency': 'USD',
                'total': '25.00'
            },
            'description': 'This weapon for real men'
        }]
    };

    paypal.payment.create(create_payment_json, function(error: any, payment: any) {
        try {
            console.log(payment);
            for (let i = 0; i < payment.links.length;i++){
                if(payment.links[i].rel === 'approval_url'){ // В объекте у нас есть массив который содержит объекты с переменной rel.
                    res.redirect(payment.links[i].href);
                }
            }
        } catch (e) {
            res.status(401).json({ message: error })
        }
    });

})

app.get('/success', (req: Request, res: Response) => {
    const payerId: string | undefined = req.query.PayerId?.toString()
    const paymentId: string | undefined = req.query.paymentId?.toString()

    const execute_payment_json: any = {
        'payer_id': payerId,
        'transactions': [{
            'amount': {
                'currency': 'USD',
                'total': '25.00'
            }
        }]
    };
    if (!paymentId || !execute_payment_json) return
    paypal.payment.execute(paymentId, execute_payment_json, function (error: any, payment: any) {
        try {
            console.log(JSON.stringify(payment))
            res.send('Success');

        } catch (e) {
            res.status(500).json({ message: error.response })
        }
    });
});

app.get('/cancel', (req: Request, res: Response) => {
    res.send('Cancelled');
})