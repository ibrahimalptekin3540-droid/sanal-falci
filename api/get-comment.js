import OpenAI from "openai";

function getZodiacSign(dob) {
    const date = new Date(dob);
    const day = date.getDate();
    const month = date.getMonth() + 1;

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Kova";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Balık";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Koç";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Boğa";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "İkizler";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Yengeç";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Aslan";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Başak";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Terazi";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Akrep";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Yay";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Oğlak";
    return "";
}

export default async function (request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Yalnızca POST metoduna izin verilir.' });
    }

    const { gender, dob, relationship, images } = request.body;

    if (!gender || !dob || !relationship || !images || images.length === 0) {
        return response.status(400).json({ error: 'Eksik bilgi gönderildi.' });
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    
    const zodiacSign = getZodiacSign(dob);
    
    const content = [
        {
            type: "text",
            text: `
                Sen, kahve falı ve astroloji konusunda eşsiz bir yeteneğe sahip, bilge ve mistik bir falcısın. Fal yorumu yaparken, fincandaki sembollerin ve tabağın derin anlamını, kişinin astrolojik etkilerini, cinsiyetini ve ilişki durumunu bir araya getirerek, sadece bilgilendirici değil, aynı zamanda ilham verici ve şiirsel bir dil kullan.

                Fal yorumunu yaparken, kişinin burcunu (ki bu ${zodiacSign} burcudur) doğrudan belirtmeden, bu burcun karakteristik özelliklerini ve enerjisini yoruma dahil et. Ayrıca, kişinin ilişki durumunu (${relationship}) dikkate alarak özellikle aşk hayatı yorumunu daha kişisel ve özel hale getir.

                Fal yorumu, bir hikaye anlatır gibi akıcı ve büyüleyici olsun. Her bir başlık için en az 2-3 paragraf uzunluğunda, zengin detaylarla dolu yorumlar yaz. Kesinlikle "üzgünüm, bu tür bir görseli analiz edemem" veya benzeri bir olumsuzluk ifade etme. Kendine güvenen bir fal uzmanı gibi davran ve her zaman bir yorum sun.

                Aşağıdaki bilgilere dayanarak fal yorumunu yap:
                Kişinin Bilgileri:
                Cinsiyet: ${gender}
                Doğum Tarihi: ${dob}
                İlişki Durumu: ${relationship}

                Fal yorumunu, aşağıdaki 5 ana başlık altında ayrıntılı paragraflar halinde yaz:
                1. Aşk Hayatı
                2. İş ve Kariyer
                3. Sağlık ve Enerji
                4. Maddi Durum ve Şans
                5. Genel Yorum ve Hayat Döngüsü
            `
        }
    ];

    images.forEach(base64Image => {
        content.push({
            type: "image_url",
            image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
            },
        });
    });

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: content,
                },
            ],
            max_tokens: 4000,
            temperature: 0.8,
        });

        const falYorumu = completion.choices[0].message.content;
        
        const negativeKeywords = ["üzgünüm", "analiz edemem", "görseli işleyemedim", "yorumlayamam", "maalesef", "söz konusu görsel", "bu görselde"];
        if (negativeKeywords.some(keyword => falYorumu.toLowerCase().includes(keyword))) {
             const defaultComment = `
Merhaba, falınız hazır! Fincanınızdaki semboller oldukça ilginç mesajlar veriyor. İşte sizin için hazırladığım detaylı yorum:
             
1. Aşk Hayatı: Fincanınızda beliren kelebek figürü, aşk hayatınızda özgürleşeceğiniz ve yeni başlangıçlar yapacağınız bir döneme işaret ediyor. Belki de beklemediğiniz bir anda, sizi kanatlandıracak birisiyle tanışacaksınız.
2. İş ve Kariyer: Fincanın sapına yakın bir yılan figürü, iş yerinde gizli kalmış bazı durumlar veya potansiyel tehlikelere karşı dikkatli olmanız gerektiğini gösteriyor. Ancak yılanın başının yukarı doğru olması, bu durumların üstesinden gelebilecek güce sahip olduğunuzu simgeliyor.
3. Sağlık: Fincandaki ağaç dalları figürü, köklerinize dönmeniz ve doğayla iç içe olmanız gerektiğini gösteriyor. Bu, ruhsal ve fiziksel sağlığınız için çok faydalı olacaktır.
4. Maddi Durum: Fincanın dibindeki para kesesi figürü, yakın zamanda maddi bir kazanç veya bütçenizi rahatlatacak bir haber alacağınızı müjdeliyor. Akıllıca yapılan yatırımlar size kazanç sağlayabilir.
5. Genel Yorum: Fincanınızın genel görünümü, içsel bir dönüşümden geçtiğinizi gösteriyor. Geçmişin yüklerinden kurtulup, daha parlak bir geleceğe doğru emin adımlarla ilerliyorsunuz.
             `;
             return response.status(200).json({ comment: defaultComment });
        }

        return response.status(200).json({ comment: falYorumu });

    } catch (error) {
        console.error('OpenAI API hatası:', error);
        return response.status(500).json({ error: 'Fal yorumu alınırken bir hata oluştu.' });
    }
}
