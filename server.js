const express = require("express");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const path = require("path");

const app = express();
const PORT = 3000;
const MAX_WIDTH = 1020; // Cambia este valor según el diseño de tu imagen

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/generate/", async (req, res) => {
    let { mensaje, destinatario, remitente, tipo, fecha, gcwebcode, validez } = req.body;
        console.log("Payload recibido:", req.body);
        console.log("Destinatario:", destinatario); // Verifica si es undefined

    try {
        // Formatear la fecha en DD/MM/AAAA usando UTC para evitar problemas de zona horaria
        const date = new Date(fecha);
        const day = String(date.getUTCDate()).padStart(2, "0"); // Día en UTC
        const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Mes en UTC (ajustado)
        const year = date.getUTCFullYear(); // Año en UTC
        fecha = `${day}/${month}/${year}`; // Ajuste al formato requerido

        // Cargar la plantilla de la gift card
        const templatePath = path.join(__dirname, "assets", "gift-card-template-v3.png");
        const image = await loadImage(templatePath);

        // Crear un canvas del tamaño de la imagen
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext("2d");

        // Dibujar la imagen de fondo
        ctx.drawImage(image, 0, 0, image.width, image.height);

        // Configuración de estilos (fuente, color, tamaño) y posiciones
        const textStyles = [
            {
                text: gcwebcode ? "Código: " + gcwebcode : "",
                font: "bold 26px Segoe UI",
                color: "#4D4B9E",
                x: 685,
                y: 375,
            },
            {
                text: mensaje,
                font: "italic 25px Segoe UI",
                color: "#4D4B9E",
                y: 550, // Mantén la posición vertical fija
            },
            {
                text: destinatario,
                font: "bold 40px Segoe UI",
                color: "#4D4B9E",
                x: 530,
                y: 695,
            },
            {
                text: remitente,
                font: "bold 40px Segoe UI",
                color: "#4D4B9E",
                x: 530,
                y: 788,
            },
            {
                text: tipo,
                font: "bold 40px Segoe UI",
                color: "#4D4B9E",
                x: 780,
                y: 878,
            },
            {
                text: fecha, // Aquí ya está en formato DD/MM/AAAA
                font: "bold 40px Segoe UI",
                color: "#4D4B9E",
                x: 530,
                y: 968,
            },
            {
                text: validez, // Aquí ya está en formato DD/MM/AAAA
                font: "italic 22px Segoe UI",
                color: "#4D4B9E",
                y: 1050,
            },
        ];
        

        // Función para dividir el texto en líneas
        function wrapText(ctx, text, maxWidth) {
            const words = text.split(" ");
            const lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const testLine = `${currentLine} ${word}`;
                const testWidth = ctx.measureText(testLine).width;

                if (testWidth > maxWidth) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }

            lines.push(currentLine); // Añadir la última línea
            return lines;
        }

        // Dibujar texto con saltos de línea centrado
    // Dibujar texto con saltos de línea centrado solo para el campo 'mensaje'
        textStyles.forEach(({ text, font, color, x, y }) => {
            ctx.font = font;
            ctx.fillStyle = color;

        if (text === mensaje || text.includes("Código: " + gcwebcode) || text === validez)  {
        // Solo aplicar wrapText a 'mensaje'
        const lines = wrapText(ctx, text, MAX_WIDTH);

        // Calcular el alto total para centrar verticalmente (opcional)
        const lineHeight = 28; // Espaciado entre líneas (ajústalo según la fuente)
        const totalHeight = lines.length * lineHeight;
        let currentY = y - totalHeight / 2; // Centrar verticalmente en torno a `y`

        // Dibujar cada línea centrada
        lines.forEach((line) => {
            const lineWidth = ctx.measureText(line).width;
            const centerX = canvas.width / 2;
            const lineX = centerX - lineWidth / 2; // Centrar horizontalmente
            ctx.fillText(line, lineX, currentY);
            currentY += lineHeight; // Mover a la siguiente línea
        });
    } else if (text !== "") { // Solo dibujar el texto si no está vacío
        // Para los demás campos, dibujar el texto normalmente
        ctx.fillText(text, x, y);
    }
});


        // Enviar la imagen como respuesta
        const buffer = canvas.toBuffer("image/png");
        res.setHeader("Content-Type", "image/png");
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generando la imagen");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});