export const fileToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (reader.result == null) {
                return resolve("");
            }
            return resolve(`${reader.result}`.replace(/^data:(.+;base64,)?/, ''))
        };
        reader.onerror = (error) => reject(error);
    });
};