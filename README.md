# REW-AutoEQ-Zapco

![Preview](https://i.imgur.com/8GQawDE.png)

Apply REW generated Auto EQ to chosen channel on Zapco ST-X existing EQ (.xps) file

# Usage

1. Generate Auto EQ file (EQ > Export filter settings as formatted text)
2. Save Zapco EQ file (Save > Save to file)
3. Input the channel (between 1 to 8) on which you want this EQ filter applied
4. Choose where you want the new EQ file to be saved
5. Generate
6. Load Zapco EQ file (Load > Load from file), see note below if something goes wrong

# Notes

- Only for ST-X DSP III Zapco (v1.02), tested with the ST-4X DSP program
- Only for simple PK type filters, maybe more to come if I figure out things
- Max gain are -20db <= gain <= +10db
- Frequency ranges are 20 <= freq <= 20khz
- Q ranges are 0.5 <= Q <= 20
- Anything outside these parameters will be auto converted to the closest limit
- Crossover filters aren't implemented yet, I'm new to Audio Tuning and have no clue how these works
- Sometimes the Zapco DSP Program bugged out when Load > Load from file and doesn't actually apply the EQ despite the UI showing so. You will need to Load the generated EQ file > Save to file, replace > Load the saved file to fix it. It will be obvious when your measurement doesn't change at all after loading the generated EQ file.
