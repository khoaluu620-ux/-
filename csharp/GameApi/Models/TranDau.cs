namespace GameApi.Models;

/// <summary>Bảng TranDau: thông tin một trận đấu.</summary>
public class TranDau
{
    public string IDTranDau { get; set; } = string.Empty;
    public string CheDoChoi { get; set; } = string.Empty;
    public DateTime ThoiGianBatDau { get; set; }
    public DateTime ThoiGianKetThuc { get; set; }
}
