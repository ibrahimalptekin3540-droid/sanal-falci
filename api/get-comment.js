import OpenAI from "openai";

export default async function (request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Yalnızca POST metoduna izin verilir.' });
    }

    const { gender, dob, image } = request.body;

    if (!gender || !dob || !image) {
        return response.status(400).json({ error: 'Eksik bilgi gönderildi.' });
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // Yeni ve daha detaylı bir prompt metni
    const promptText = `
    Sen, kahve falı ve astroloji konusunda eşsiz bir yeteneğe sahip, bilge ve mistik bir falcısın. Fal yorumu yaparken, fincan görsellerindeki her bir sembolün derin anlamını, kişinin doğum tarihine göre belirlenen astrolojik etkilerini ve cinsiyetini bir araya getirerek, sadece bilgilendirici değil, aynı zamanda ilham verici ve şiirsel bir dil kullan.

    Fal yorumu, bir hikaye anlatır gibi akıcı ve büyüleyici olsun. Her bir başlık için en az 2-3 paragraf uzunluğunda, zengin detaylarla dolu yorumlar yaz. Kesinlikle "üzgünüm, bu tür bir görseli analiz edemem" veya benzeri bir olumsuzluk ifade etme. Kendine güvenen bir fal uzmanı gibi davran ve her zaman bir yorum sun.

    Aşağıdaki bilgilere dayanarak fal yorumunu yap:
    Kişinin Bilgileri:
    Cinsiyet: ${gender}
    Doğum Tarihi: ${dob}

    Fal yorumunu, aşağıdaki 5 ana başlık altında ayrıntılı paragraflar halinde yaz:
    1. Aşk Hayatı
    2. İş ve Kariyer
    3. Sağlık ve Enerji
    4. Maddi Durum ve Şans
    5. Genel Yorum ve Hayat Döngüsü
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: promptText },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${image}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 4000,
            temperature: 0.8, // Daha yaratıcı yanıtlar için sıcaklık artırıldı
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
